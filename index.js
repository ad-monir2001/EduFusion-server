require('dotenv').config();
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();
const jwt = require('jsonwebtoken');
const corsOptions = {
  origin: ['http://localhost:5173', 'https://edufusion-f285c.web.app'],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World');
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const sessionCollection = db.collection('session');
    const materialCollection = db.collection('materials');
    const noteCollection = db.collection('notes');

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
    app.get('/users', verifyToken, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // update a user to admin || tutor || student
    app.patch('/users/role/:id', async (req, res) => {
      const id = req.params.id;
      const { role } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: role,
        },
      };
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // search a user by name
    app.get('/search', async (req, res) => {
      const searchText = req.query.searchText;
      const query = {
        $or: [{ name: { $regex: searchText, $options: 'i' } }],
      };

      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // get users role
    app.get('/users/role/:email', async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email });
      res.send({ role: result?.role });
    });

    // create new session by tutor
    app.post('/session', async (req, res) => {
      const data = req.body;
      const result = await sessionCollection.insertOne(data);
      res.send(result);
    });

    // get study session data for specific tutors
    app.get('/session/:email', async (req, res) => {
      const email = req.params.email;
      const result = await sessionCollection.find({ email: email }).toArray();
      res.send(result);
    });

    // get study session data for admin and all
    app.get('/session', async (req, res) => {
      const result = await sessionCollection.find().toArray();
      res.send(result);
    });

    // update session status to approved
    app.patch('/session/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: updatedData,
      };
      const result = await sessionCollection.updateOne(query, update);
      res.send(result);
    });

    // delete session data
    app.delete('/session/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await sessionCollection.deleteOne(query);
      res.send(result);
    });

    // upload material for specific session
    app.post('/materials', async (req, res) => {
      const data = req.body;
      const result = await materialCollection.insertOne(data);
      res.send(result);
    });
    // update notes
    app.patch('/notes/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: updatedData,
      };
      const result = await noteCollection.updateOne(query, update);
      res.send(result);
    });

    // create note for student
    app.post('/notes', async (req, res) => {
      const data = req.body;
      const result = await noteCollection.insertOne(data);
      res.send(result);
    });

    // get note data
    app.get('/notes/:email', async (req, res) => {
      const email = req.params.email;
      const result = await noteCollection.find({ email: email }).toArray();
      res.send(result);
    });

    // delete a note
    app.delete('/notes/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await noteCollection.deleteOne(query);
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
