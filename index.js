require('dotenv').config();
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();
const jwt = require('jsonwebtoken');
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

    // jwt related functionality
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '350d',
      });
      res.send({ token });
    });

    // middlewares
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' });
        }
        req.decoded = decoded;
        next();
      });
    };

    // save a new user in db
    app.post('/users/:email', async (req, res) => {
      const { email } = req.params;
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

    // get tutor data
    app.get('/users/:role', async (req, res) => {
      const role = req.params.role;
      const query = { role: role };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // get user data
    app.get('/users',verifyToken, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // get users role
    app.get('/users/role/:email', async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email });
      res.send({ role: result?.role });
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
