import mongoose from 'mongoose';
const uri = 'mongodb://faridaahmed212004_db_user:G6pRJQdLxLgutZYP@ac-h4qktic-shard-00-00.eabermo.mongodb.net:27017,ac-h4qktic-shard-00-01.eabermo.mongodb.net:27017,ac-h4qktic-shard-00-02.eabermo.mongodb.net:27017/?ssl=true&replicaSet=atlas-3vc3to-shard-0&authSource=admin&appName=Cluster0';
mongoose.connect(uri).then(async () => {
  const db = mongoose.connection;
  const result = await db.collection('products').updateMany({ status: 'pending' }, { $set: { status: 'approved' } });
  console.log('Updated ' + result.modifiedCount + ' products to approved status.');
  mongoose.disconnect();
}).catch(err => console.error(err));
