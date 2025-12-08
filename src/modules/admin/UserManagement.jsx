import React, { useEffect, useState } from 'react';
import { Plus, Settings, Lock, UserCheck, Trash2 } from 'lucide-react';
import { Button, Card, Modal } from '../../components/ui/SharedComponents';
import { supabase } from '../../supabase/supabaseClient';

const UserManagement = ({ users, setUsers }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Cargar usuarios desde Supabase al montar (si no vienen por props)
  useEffect(() => {
    // Si la lista ya viene por props no forzamos la carga, pero normalmente
    // queremos asegurarnos que estén sincronizados con la BD.
    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, phone, role, pin, password, join_date, active')
          .order('id', { ascending: true });

        if (error) throw error;
        if (setUsers) setUsers(data);
      } catch (err) {
        console.error('Error cargando usuarios', err);
        // opcional: show toast/alert
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setFormError('');

    const formData = new FormData(e.target);
    const userData = {
      name: formData.get('name')?.trim(),
      email: formData.get('email')?.trim() || null,
      phone: formData.get('phone')?.trim() || null,
      role: formData.get('role') || 'vendedor',
      pin: formData.get('pin')?.trim(),
      password: formData.get('password') || null,
      // join_date: si creas, lo setea la BD por defecto; para compatibilidad lo podemos setear aquí
    };

    // Validaciones simples
    if (!userData.name) {
      setFormError('El nombre es requerido.');
      return;
    }
    if (!userData.pin || userData.pin.length < 4) {
      setFormError('El PIN debe tener 4 dígitos.');
      return;
    }
    // No mostramos o encriptamos password aquí; en producción deberías usar hashing en backend/service role.

    try {
      if (editingUser) {
        // Actualizar
        const { data, error } = await supabase
          .from('users')
          .update(userData)
          .eq('id', editingUser.id)
          .select()
          .single();

        if (error) throw error;

        if (setUsers) {
          setUsers(prev => prev.map(u => (u.id === data.id ? data : u)));
        }
      } else {
        // Crear
        const now = new Date().toISOString().split('T')[0]; // yyyy-mm-dd
        const toInsert = { ...userData, join_date: now, active: true };
        const { data, error } = await supabase
          .from('users')
          .insert([toInsert])
          .select()
          .single();

        if (error) throw error;

        if (setUsers) setUsers(prev => [...(prev || []), data]);
      }

      setIsModalOpen(false);
      setEditingUser(null);
    } catch (err) {
      console.error('Error guardando usuario:', err);
      setFormError(err.message || 'Error guardando usuario');
    }
  };

  const toggleStatus = async (id) => {
    try {
      const user = (users || []).find(u => u.id === id);
      if (!user) return;
      const newStatus = !user.active;

      const { data, error } = await supabase
        .from('users')
        .update({ active: newStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (setUsers) setUsers(prev => prev.map(u => (u.id === id ? data : u)));
    } catch (err) {
      console.error('Error cambiando estatus', err);
      alert('Error cambiando estatus');
    }
  };

  const handleDelete = async (id) => {
    //if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      if (setUsers) setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error('Error eliminando usuario', err);
      alert('Error eliminando usuario');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Gestión de Usuarios</h2>
          <p className="text-[#4A4A4A]">Administra el acceso y roles del personal</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={openCreateModal}>Nuevo Usuario</Button>
      </div>

      {loading ? <div>Cargando usuarios...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(users || []).map(user => (
            <Card key={user.id} className={`border-l-4 ${user.active ? 'border-l-green-500' : 'border-l-gray-300'}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${user.role === 'admin' ? 'bg-[#FFC857] text-[#1A1A1A]' : 'bg-[#0F4C3A] text-white'}`}>
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className={`font-bold ${!user.active && 'text-gray-400 line-through'}`}>{user.name}</h3>
                    <div className="text-xs uppercase font-bold tracking-wider text-gray-500">{user.role}</div>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button onClick={() => openEditModal(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Settings size={16} /></button>
                  <button onClick={() => toggleStatus(user.id)} className={`p-2 rounded ${user.active ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                    {user.active ? <Lock size={16} /> : <UserCheck size={16} />}
                  </button>
                  <button onClick={() => handleDelete(user.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm text-gray-500">
                <span>PIN: ••••</span>
                <span>Alta: {user.join_date ? user.join_date.split('T')[0] : user.joinDate || '-'}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingUser(null); }} title={editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}>
        <form id="userForm" onSubmit={handleSaveUser} className="space-y-4">
          {formError && <div className="text-red-600 p-2 bg-red-50 rounded">{formError}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre Completo</label>
              <input name="name" required defaultValue={editingUser?.name} className="w-full p-2 border rounded outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rol</label>
              <select name="role" defaultValue={editingUser?.role || 'vendedor'} className="w-full p-2 border rounded outline-none">
                <option value="vendedor">Vendedor</option>
                <option value="admin">Administrador</option>
                <option value="dueño">Dueño</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input name="email" type="email" defaultValue={editingUser?.email} className="w-full p-2 border rounded outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input name="phone" type="tel" defaultValue={editingUser?.phone} className="w-full p-2 border rounded outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">PIN de Acceso (4 dígitos)</label>
              <input name="pin" type="tel" maxLength={4} required defaultValue={editingUser?.pin} className="w-full p-2 border rounded bg-yellow-50 outline-none" placeholder="XXXX" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contraseña (Login)</label>
              <input name="password" type="text" required defaultValue={editingUser?.password} className="w-full p-2 border rounded bg-gray-50 outline-none" placeholder="Contraseña segura" />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => { setIsModalOpen(false); setEditingUser(null); }}>Cancelar</Button>
            <Button variant="primary" type="submit">Guardar Usuario</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
