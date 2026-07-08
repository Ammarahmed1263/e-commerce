import mod from '../routes/vendorRoutes.js';
const router = mod;
router.stack.forEach((layer, i) => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
    console.log(i, methods, layer.route.path, '| regexp:', layer.regexp?.source?.substring(0, 50));
  } else {
    console.log(i, 'MW:', layer.name, '| regexp:', layer.regexp?.source?.substring(0, 50));
  }
});
