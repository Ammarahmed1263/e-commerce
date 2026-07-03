export const generateOrderNumber = () => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  
  const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
  
  return `ORD-${yyyy}${mm}${dd}-${randomStr}`;
};
