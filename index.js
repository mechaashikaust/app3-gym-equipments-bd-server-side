const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

const jwt = require('jsonwebtoken');
require('dotenv').config();


// Middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
    })
    next();
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yupgi.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {

    try {
        await client.connect();

        const equipmentCollection = client.db("gymEquipmentDB").collection("equipment");
        const myitemCollection = client.db("gymEquipmentDB").collection("myitem");

        // Auth
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        })


        // Get Equipments
        app.get('/equipment', async (req, res) => {
            const query = {};
            const cursor = equipmentCollection.find(query);
            const equipments = await cursor.toArray();
            res.send(equipments);
        })

        app.get('/equipment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const equipment = await equipmentCollection.findOne(query);
            res.send(equipment);
        })

        // POST User :  Add a new Service
        app.post('/equipment', async (req, res) => {
            const newEquipment = req.body;
            const result = await equipmentCollection.insertOne(newEquipment);
            res.send(result);
        })

        // Update User

        app.put('/equipment/:id', async (req, res) => {
            const id = req.params.id;
            const updatedUser = req.body;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };

            const updatedDoc = {
                $set: {
                    name: updatedUser.name,
                    price: updatedUser.price,
                    description: updatedUser.description,
                    img: updatedUser.img
                }
            };
            const result = await equipmentCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        // Delete a Equipment

        app.delete('/equipment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await equipmentCollection.deleteOne(query);
            res.send(result);
        })


        // My Item Collection API 

        // Get items
        app.get('/myitem', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = myitemCollection.find(query);
                const myitems = await cursor.toArray();
                res.send(myitems);
            }
            else{
                res.status(403).send({ message: 'Forbidden Access' })
            }
        })


        // Add a new item
        app.post('/myitem', async (req, res) => {
            const myItem = req.body;
            const result = await myitemCollection.insertOne(myItem);
            res.send(result);
        })

    }

    finally {

    }

}

run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Running Gemius Car Server');
})

app.listen(port, () => {
    console.log('CRUD Server is Running');
})
