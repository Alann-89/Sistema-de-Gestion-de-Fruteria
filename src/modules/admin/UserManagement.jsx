import React, { useState } from 'react';
import { Plus, Settings, Lock, UserCheck } from 'lucide-react';
import { Button, Card, Modal } from '../../components/ui/SharedComponents';

const UserManagement = ({ users, setUsers }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const handleSaveUser = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newUser = { 
      id: editingUser ? editingUser.id : Date.now(), 
      name: formData.get('name'), 
      email: formData.get('email'),
      phone: formData.get('phone'),
      role: formData.get('role'), 
      pin: formData.get('pin'), 
      password: formData.get('password'), 
      joinDate: editingUser ? editingUser.joinDate : new Date().toISOString().split('T')[0],
      active: true 
    };
    setUsers(editingUser ? users.map(u => u.id === editingUser.id ? newUser : u) : [...users, newUser]);
    setIsModalOpen(false);
  };
  const toggleStatus = (id) => setUsers(users.map(u => u.id === id ? { ...u, active: !u.active } : u));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-[#1A1A1A]">Gestión de Usuarios</h2><p className="text-[#4A4A4A]">Administra el acceso y roles del personal</p></div>
        <Button variant="primary" icon={Plus} onClick={() => { setEditingUser(null); setIsModalOpen(true); }}>Nuevo Usuario</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => (
          <Card key={user.id} className={`border-l-4 ${user.active ? 'border-l-green-500' : 'border-l-gray-300'}`}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${user.role === 'admin' ? 'bg-[#FFC857] text-[#1A1A1A]' : 'bg-[#0F4C3A] text-white'}`}>{user.name.charAt(0)}</div>
                <div><h3 className={`font-bold ${!user.active && 'text-gray-400 line-through'}`}>{user.name}</h3><div className="text-xs uppercase font-bold tracking-wider text-gray-500">{user.role}</div></div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingUser(user); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Settings size={16}/></button>
                <button onClick={() => toggleStatus(user.id)} className={`p-2 rounded ${user.active ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>{user.active ? <Lock size={16}/> : <UserCheck size={16}/>}</button>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm text-gray-500"><span>PIN: ••••</span><span>Alta: {user.joinDate}</span></div>
          </Card>
        ))}
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}>
        <form id="userForm" onSubmit={handleSaveUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div><label className="block text-sm font-medium mb-1">Nombre Completo</label><input name="name" required defaultValue={editingUser?.name} className="w-full p-2 border rounded outline-none" /></div>
             <div><label className="block text-sm font-medium mb-1">Rol</label><select name="role" defaultValue={editingUser?.role || 'vendedor'} className="w-full p-2 border rounded outline-none"><option value="vendedor">Vendedor</option><option value="admin">Administrador</option><option value="dueño">Dueño</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div><label className="block text-sm font-medium mb-1">Email</label><input name="email" type="email" defaultValue={editingUser?.email} className="w-full p-2 border rounded outline-none" /></div>
             <div><label className="block text-sm font-medium mb-1">Teléfono</label><input name="phone" type="tel" defaultValue={editingUser?.phone} className="w-full p-2 border rounded outline-none" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div><label className="block text-sm font-medium mb-1">PIN de Acceso (4 dígitos)</label><input name="pin" type="tel" maxLength={4} required defaultValue={editingUser?.pin} className="w-full p-2 border rounded bg-yellow-50 outline-none" placeholder="XXXX" /></div>
             <div><label className="block text-sm font-medium mb-1">Contraseña (Login)</label><input name="password" type="text" required defaultValue={editingUser?.password} className="w-full p-2 border rounded bg-gray-50 outline-none" placeholder="Contraseña segura" /></div>
          </div>
          <div className="pt-4 flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button><Button variant="primary" type="submit">Guardar Usuario</Button></div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;