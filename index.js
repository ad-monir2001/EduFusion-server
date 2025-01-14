require('dotenv').config();
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();

const corsOptions = {
  origin: ['http://localhost:5173'],
  Credential: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World');
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.8mt9x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // collections in the database
    const db = client.db('eduSphere');
    const usersCollection = db.collection('users');

    // save a new user in db
    app.post('/users/:email', async (req, res) => {
      const query = { email };
      const user = req.body;
      // check if the user already exist in db
      const isExist = await usersCollection.findOne(query);
      if (isExist) {
        return res.send(isExist);
      }
      const result = await usersCollection.insertOne({
        ...user,
        timestamp: Date.now(),
      });
      res.send(result);
    });
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
