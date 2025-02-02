const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ObjectId } = require('mongodb');
const client = new MongoClient(process.env.MONGO_URL);

app.use(express.urlencoded({ extended: true }));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users', async (req, res) => {
  try {
    const database = client.db("freecodecampDB");
    const collectionUsers = database.collection("exercise-tracker-users");
    const { username } = req.body
    const query = { username };
    const user = await collectionUsers.findOne(query);
    if (user) {
      res.json(user);
    } else {
      const result = await collectionUsers.insertOne(query);
      res.json(query);
    }
  } catch (error) {
    res.json(error);
  }
})
// 679e9fa0ee644d8f4c0a6523
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const database = client.db("freecodecampDB");
    const collectionExercises = database.collection("exercise-tracker-exercises");
    const collectionUsers = database.collection("exercise-tracker-users");
    const _id = new ObjectId(req.params['_id']);
    const { description, duration, date } = req.body
    let query = { _id };
    const user = await collectionUsers.findOne(query);
    if (user) {
      query = {
        '_id': _id,
        username: user.username,
        description,
        duration: parseInt(duration, 10) ,
        date: new Date(date)
      };
      const result = await collectionExercises.insertOne(query);
      res.json({
        '_id': _id,
        username: user.username,
        description,
        duration: parseInt(duration, 10) ,
        date: date ? new Date(date): new Date()
      });
    } else {
      res.json({ estado: 'no encontrado' });
    }
  } catch (error) {
    res.json(error)
  }
})

app.get('/api/users',async (req,res)=>{
  try{
    const database = client.db("freecodecampDB");
  const collectionUsers = database.collection("exercise-tracker-users");
  const result = await collectionUsers.find({}).toArray();
  res.json(result);
  }catch(error){
    res.json(error);
  }
  
})
// https://3000-freecodecam-boilerplate-o1pu35flxgr.ws-us117.gitpod.io/api/users/679eb2cdf4097b3643740a65/logs
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const database = client.db("freecodecampDB");
    const collectionExercises = database.collection("exercise-tracker-exercises");
    const collectionUsers = database.collection("exercise-tracker-users");

    const _id = new ObjectId(req.params['_id']);
    const user = await collectionUsers.findOne({ _id });

    if (!user) {
      return res.json({ estado: "sin resultados" });
    }

    let query = { _id };

    
    const { from, to, limit } = req.query;
    let dataObj = {};

    if(from){
      dataObj["$gte"] = new Date(from)
    }

    if(to){
      dataObj["$lte"] = new Date(to)
    }

    if(from || to){
      query.date=dataObj;
    }
    console.log(query)

    const exercises = await collectionExercises
      .find(query, { projection: { description: 1, duration: 1, date: 1, _id: 0 } })
      .limit(+limit ?? 500) 
      .toArray();

    const log = exercises.map((exercise) => ({
      description: exercise.description,
      duration: exercise.duration ,
      date: new Date(exercise.date).toDateString(),
    }));

    res.json({
      username: user.username,
      count: log.length,
      _id: user._id,
      log
    });
  } catch (error) {
    res.json(error);
  }
});




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
