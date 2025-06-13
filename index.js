require('dotenv').config()
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000


app.use(cors())
app.use(express.json())




const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.eqhhjdx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
      await client.connect();

    const itemsCollection = client.db('whereIsItDB').collection('items')
      

    app.post('/items', async (req, res) => {
      const item = req.body
      const result = await itemsCollection.insertOne(item)
      res.send(result)
    })
    

    app.get('/items', async (req, res) => {
      const { title } = req.query;
      const query = {};
      
      if (title) {
        query.title = { $regex: title, $options: 'i' };
      }

      try {
        const result = await itemsCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch items', error });
      }
    })
    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send("hello and welcome to lost and found server")
})

app.listen(port, ()=> {
    console.log(`the server is running on port ${port}`);
    
})