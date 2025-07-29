const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const OpenApiValidator = require('express-openapi-validator');
const app = express();
const port = 3000;

/*
app.use('/api-docs', swaggerUi.serve, (req, res) => {
  const swaggerDocument = YAML.load('./openapi.yaml');
  return swaggerUi.setup(swaggerDocument)(req, res);
});*/

app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

const swaggerDocument = YAML.load('./openapi.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.json());
app.use(
  OpenApiValidator.middleware({
    apiSpec: swaggerDocument,
    validateRequests: true,
    validateResponses: true,
  })
);

// Simulación de base de datos en memoria
const users = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    age: 30
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    age: 25
  }
];

// Simulación de base de datos para productos
const products = [
  {
    id: 1,
    name: "Samsung Galaxy S23 Ultra",
    price: 1199.99,
    description: "Smartphone Android con pantalla Dynamic AMOLED 2X de 6.8'', 256GB almacenamiento, 12GB RAM, cámara principal 200MP, batería 5000mAh",
    category: "Electronics",
    tags: ["smartphones", "samsung", "android", "5G"],
    inStock: 45,
    specifications: {
      phone1: {
        processor: "Snapdragon 8 Gen 2",
        screen: "6.8 inch Dynamic AMOLED 2X",
        battery: "5000mAh",
        ram: "12GB",
        storage: "256GB",
        os: "Android 13"
      }
    },
    ratings: [
      {
        score: 4.5,
        comments: "Excelente teléfono, la calidad de la cámara es increíble y la duración de la batería supera mis expectativas"
      }
    ]
  }
];

/*
const v1Router = express.Router();
const v2Router = express.Router();

// Endpoint de prueba
v1Router.get('/hello', (req, res) => {
  res.json({ message: "hello world" });
});

v2Router.get('/hello', (req, res) => {
  res.json({ message: "hello world v2", version: "v2", date: new Date() });
});*/

const v1Router = require('./routes/v1');
const v2Router = require('./routes/v2');

// Endpoint para crear usuarios
app.post('/users', (req, res) => {
  // Desestructuramos los datos del cuerpo de la petición
  const { name, age, email } = req.body;
  // Creamos el nuevo usuario
  const newUser = {
    id: users.length > 0 ? users[users.length - 1].id + 1 : 1,
    name,
    age,
    email
  };
  // Agregamos el usuario al array simulado
  users.push(newUser);
  // Enviamos la respuesta
  res.status(201).json(newUser);
});

// Obtener usuario por ID
app.get('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: "Recurso no encontrado" });
  }
  res.json({ ...user });
});

// Actualizar usuario por ID
app.post('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ message: "Recurso no encontrado" });
  }
  const { name, email, age } = req.body;
  users[userIndex] = { ...users[userIndex], name, email, age };
  res.json({ ...users[userIndex] });
});

// Endpoint para crear un producto
app.post('/v1/products', (req, res) => {
  const {
    name,
    price,
    description,
    category,
    tags,
    inStock,
    specifications,
    ratings
  } = req.body;

  // Validaciones básicas según el esquema
  if (
    typeof name !== 'string' || name.length < 3 || name.length > 50 ||
    typeof price !== 'number' || price < 0.01 ||
    !["Electronics", "Clothing", "Home", "Beauty"].includes(category) ||
    (tags && (!Array.isArray(tags) || tags.length < 1 || tags.length > 5)) ||
    (typeof inStock !== 'undefined' && (typeof inStock !== 'number' || inStock < 0))
  ) {
    return res.status(400).json({ message: "Datos de producto inválidos" });
  }

  const newProduct = {
    id: products.length + 1,
    name,
    price,
    description,
    category,
    tags,
    inStock,
    specifications,
    ratings
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Endpoint para obtener todos los productos
app.get('/v1/products', (req, res) => {
  res.json(products);
});

app.get('/v1/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = products.find(p => p.id === productId);

  if (!product) {
    return res.status(404).json({ message: "Producto no encontrado" });
  }

  res.json(product);
});

app.put('/v1/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const productIndex = products.findIndex(p => p.id === productId);

  if (productIndex === -1) {
    return res.status(404).json({ message: "Producto no encontrado" });
  }

  const {
    name,
    price,
    description,
    category,
    tags,
    inStock,
    specifications,
    ratings
  } = req.body;

  products[productIndex] = {
    ...products[productIndex],
    name,
    price,
    description,
    category,
    tags,
    inStock,
    specifications,
    ratings
  };

  res.json(products[productIndex]);
});

app.delete('/v1/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const productIndex = products.findIndex(p => p.id === productId);

  if (productIndex === -1) {
    return res.status(404).json({ message: "Producto no encontrado" });
  }

  products.splice(productIndex, 1);
  res.status(204).send();
});

// Middleware para manejar errores de validación y otros errores
app.use((err, req, res, next) => {
  let message = err.message;
  if (err.name === 'ValidationError') {
    message = 'Error de validación de datos';
  } else if (err.name === 'UnauthorizedError') {
    message = 'No autorizado para acceder a este recurso';
  } else if (err.name === 'Not Found') {
    message = 'Pagina no encontrada';
  }

  res.status(err.status || 500).json({
    error: message,
    detalles: err.errors || null,
  });
});

app.use("/v1", v1Router);
app.use("/v2", v2Router);

app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}/v1`);
  console.log(`🚀 Servidor corriendo en http://localhost:${port}/v2`);
  console.log(`📘 Documentación disponible en http://localhost:${port}/api-docs`);
});



