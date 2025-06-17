require('dotenv').config()
const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken')
const cookieParser =require('cookie-parser')
const port = process.env.PORT || 5000


app.use(cors({
  origin: ['https://whereisit-app.web.app', 'http://localhost:5173'],
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser());


const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token
  console.log("inside the verify token middleware", token)
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" })
  }

  // verify token

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" })
    }
    console.log(decoded);
    req.decoded = decoded
    next()
  })
  
}

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
      // await client.connect();

    const itemsCollection = client.db('whereIsItDB').collection('items')
    const recoveredCollection = client.db('whereIsItDB').collection('recovered')
      

    app.post('/jwt', async (req, res) => {
      const userData = req.body
      const token = jwt.sign(userData, process.env.JWT_ACCESS_SECRET, { expiresIn: '30d' })
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
      res.send({ success: true })
    })


    
    app.post('/items', async (req, res) => {
      const item = req.body
      const result = await itemsCollection.insertOne(item)
      res.send(result)
    })
    

    app.get('/items', verifyToken, async (req, res) => {
      const { title } = req.query;
      const query = {};
      if (title) {
        query.Search_input = { $regex: title, $options: 'i' };
      }

      try {
        const result = await itemsCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch items', error });
      }
    })


    app.get('/items/:id', verifyToken, async(req, res) => {
      const id = req.params.id
      console.log('inside application cookie', req.cookies);
      const query = { _id: new ObjectId(id) }
      const result = await itemsCollection.findOne(query)
      res.send(result)
    })
    
    
    app.get('/user/:email', verifyToken, async (req, res) => {
      const email = req.params.email
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" })
      }
      const query = { email: email };
      const result = await itemsCollection.find(query).toArray();
      res.send(result)
    })


    app.put('/update/:id', verifyToken, async (req, res) => {
        const id = req.params.id
        const filter = { _id: new ObjectId(id) }
        const updatedCoffee = req.body
        const options = { upsert: true }
        const updatedDoc = {
          $set: updatedCoffee
        }
        const result = await itemsCollection.updateOne(filter, updatedDoc, options)
        res.send(result)
      
      
      })


    app.get('/recent', verifyToken, async (req, res) => {
      try {
        const result = await itemsCollection.find().sort({ recent_date: -1  }).limit(6).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch recent items', error });
      }
    });


    app.patch('/items', async (req, res) => {
      const { id } = req.body
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
      $set: {
                recovered: true
            }
      }
      const result = await itemsCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })


    app.post('/recovered', async (req, res) => {
      const item = req.body
      const result = await recoveredCollection.insertOne(item)
      res.send(result)
    })



    app.get('/recovered/:email', verifyToken, async (req, res) => {
      const email = req.params.email
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" })
      }
      const query = { recovered_mail: email };
      const result = await recoveredCollection.find(query).toArray();
      res.send(result)
    })
    
    
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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