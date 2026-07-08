import app from '../app.js';

console.log('\n=== APP ROUTER LAYERS ===');
app._router.stack.forEach((layer, i) => {
  if (layer.handle && layer.handle.stack) {
    // This is a mounted router
    const regexpStr = layer.regexp?.source ?? '';
    // Extract path from regexp
    const pathMatch = regexpStr.match(/\^\\\/([^\\]+)/);
    const path = pathMatch ? '/' + pathMatch[1].replace(/\\\//g, '/') : regexpStr.substring(0, 30);
    console.log(i, 'ROUTER mounted at:', path, '| routes:', layer.handle.stack.filter(l => l.route).length);
  } else if (layer.route) {
    console.log(i, 'ROUTE:', Object.keys(layer.route.methods).join(',').toUpperCase(), layer.route.path);
  } else {
    console.log(i, 'MW:', layer.name);
  }
});
