const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const client = new MongoClient(process.env.MONGO_URL);

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', async (req, res) => {
  try {
    const database = client.db('freecodecampDB');
    const collectionUsers = database.collection('exercise-tracker-users');
    const { username } = req.body;
    const query = { username };
    const user = await collectionUsers.findOne(query);

    if (user) {
      res.json(user);
    } else {
      const result = await collectionUsers.insertOne(query);
      res.json({ username, _id: result.insertedId });
    }
  } catch (error) {
    res.json(error);
  }
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const database = client.db('freecodecampDB');
    const collectionExercises = database.collection('exercise-tracker-exercises');
    const collectionUsers = database.collection('exercise-tracker-users');
    const _id = new ObjectId(req.params['_id']);
    const { description, duration, date } = req.body;

    const user = await collectionUsers.findOne({ _id });

    if (user) {
      const exercise = {
        userId: user._id,
        username: user.username,
        description,
        duration: parseInt(duration, 10),
        date: date ? new Date(date) : new Date(),
      };

      const result = await collectionExercises.insertOne(exercise);

      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
      });
    } else {
      res.json({ estado: 'no encontrado' });
    }
  } catch (error) {
    res.json(error);
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const database = client.db('freecodecampDB');
    const collectionUsers = database.collection('exercise-tracker-users');
    const result = await collectionUsers.find({}).toArray();
    res.json(result);
  } catch (error) {
    res.json(error);
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const database = client.db('freecodecampDB');
    const collectionExercises = database.collection('exercise-tracker-exercises');
    const collectionUsers = database.collection('exercise-tracker-users');

    const _id = new ObjectId(req.params['_id']);
    const user = await collectionUsers.findOne({ _id });

    if (!user) {
      return res.json({ estado: 'sin resultados' });
    }

    // Obtener los parámetros de la consulta
    const { from, to, limit } = req.query;

    // Crear el filtro para las fechas
    const dateFilter = {};
    if (from) {
      dateFilter.$gte = new Date(from); // Fecha de inicio
    }
    if (to) {
      dateFilter.$lte = new Date(to); // Fecha de fin
    }

    // Crear la consulta para los ejercicios
    const query = { userId: user._id };
    if (from || to) {
      query.date = dateFilter;
    }

    // Obtener los ejercicios
    let exercises = await collectionExercises
      .find(query, { projection: { description: 1, duration: 1, date: 1, _id: 0 } })
      .limit(parseInt(limit) || 0) // Aplicar el límite si está presente
      .toArray();

    // Convertir el campo "date" a dateString
    exercises = exercises.map((exercise) => ({
      description: exercise.description,
      duration: exercise.duration,
      date: new Date(exercise.date).toDateString(),
    }));

    // Crear la respuesta
    const result = {
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log: exercises,
    };

    res.json(result);
  } catch (error) {
    res.json(error);
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});