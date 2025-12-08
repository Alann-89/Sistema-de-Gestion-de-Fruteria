import React, { useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Button, Card } from '../../components/ui/SharedComponents';
import { supabase } from '../../supabase/supabaseClient';


const LoginScreen = ({ onLogin, users }) => {
  const [method, setMethod] = useState('pin'); 
  const [inputVal, setInputVal] = useState('');
  const [passwordVal, setPasswordVal] = useState(''); 
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  const handleLogin = async (e) => {
  e.preventDefault();
  setError('');
  console.log("Método seleccionado:", method);
  console.log("Valor ingresado:", inputVal);
  console.log("Password ingresado:", passwordVal);
  try {
    let query;

    if (method === 'pin') {
      // Login por PIN
      query = supabase
        .from("users")
        .select("*")
        .eq("pin", inputVal.trim())
        .eq("active", true)
        .single();
    } else {
      // Login por usuario + contraseña
      query = supabase
        .from("users")
        .select("*")
        .eq("name", inputVal.trim())
        .eq("password", passwordVal)
        .eq("active", true)
        .single();
    } if (method === 'pin') {
        query = supabase.from("users").select("*").eq("pin", inputVal.trim()).eq("active", true).single();
      } else {
        query = supabase.from("users").select("*").eq("name", inputVal.trim()).eq("password", passwordVal).eq("active", true).single();
      }
    

        console.log("Ejecutando query...");
    const { data, error: supaError } = await query;

        console.log("Resultado Supabase:", { data, supaError });

    if (supaError || !data) {
      setError("Credenciales inválidas o usuario inactivo");
      return;
    }

    // Login exitoso → regresamos el usuario completo (row)
    localStorage.setItem('fruteria_user', JSON.stringify(data));
    onLogin(data);

  } catch (err) {
    console.error(err);
    setError("Error de conexión con la nube");
  }
};


  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2 text-sm bg-white px-3 py-1 rounded-full shadow-sm border">
        {isOnline ? <Wifi size={14} className="text-green-600"/> : <WifiOff size={14} className="text-red-500"/>}
        <span className={isOnline ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>{isOnline ? 'Conectado a la Nube' : 'Modo Offline'}</span>
      </div>
      <Card className="w-full max-w-md border-t-8 border-t-[#0F4C3A]">
        <div className="text-center mb-8 pt-4">
          <div className="w-24 h-24 bg-[#0F4C3A] rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg"><span className="text-4xl">🍊</span></div>
          <h1 className="text-3xl font-bold text-[#0F4C3A]">Frutería ICI</h1>
          <p className="text-[#4A4A4A]">Sistema de Punto de Venta</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${method === 'pin' ? 'bg-white shadow text-[#0F4C3A]' : 'text-gray-500'}`} onClick={() => { setMethod('pin'); setInputVal(''); setError(''); }}>Acceso con PIN</button>
          <button className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${method === 'user' ? 'bg-white shadow text-[#0F4C3A]' : 'text-gray-500'}`} onClick={() => { setMethod('user'); setInputVal(''); setError(''); }}>Usuario / Contraseña</button>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#4A4A4A] mb-1">{method === 'pin' ? 'Ingrese su PIN de 4 dígitos' : 'Nombre de Usuario'}</label>
            <input type={method === 'pin' ? "tel" : "text"} maxLength={method === 'pin' ? 4 : 20} className="w-full p-4 text-center text-xl tracking-widest border border-[#D6D6D6] rounded-lg focus:ring-2 focus:ring-[#0F4C3A] outline-none" placeholder={method === 'pin' ? "••••" : "Usuario"} value={inputVal} onChange={(e) => setInputVal(e.target.value)} autoFocus />
          </div>
          {method === 'user' && (
             <div><label className="block text-sm font-medium text-[#4A4A4A] mb-1">Contraseña</label><input type="password" className="w-full p-4 border border-[#D6D6D6] rounded-lg focus:ring-2 focus:ring-[#0F4C3A] outline-none" placeholder="Contraseña" value={passwordVal} onChange={(e) => setPasswordVal(e.target.value)} /></div>
          )}
          {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}
          <Button variant="primary" className="w-full h-12 text-lg" type="submit">Ingresar</Button>
        </form>
      </Card>
    </div>
  );
};

export default LoginScreen;