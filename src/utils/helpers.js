export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

export const getCurrentDate = () => new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
export const formatTime = (date) => new Date(date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
export const formatDateShort = (date) => new Date(date).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' });

// Generador de CSV
export const downloadCSV = (data, filename) => {
  const csvContent = "data:text/csv;charset=utf-8," 
    + data.map(e => Object.values(e).join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};