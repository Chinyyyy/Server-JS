const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const PORT = process.env.PORT || "3000"
const SECRET = process.env.JWT_SECRET || "clave_super_secreta";

const app = express();
app.use(cors());
app.use(express.json());

/* ============================
   CONFIGURACIÓN SWAGGER
============================ */

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API Escuela",
            version: "1.0.0",
            description: "Documentación oficial de la API Escuela con autenticación JWT"
        },
        servers: [
            {
                url: "http://localhost:3000"
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        }
    },
    apis: ["./server.js"]
};

const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

/* ============================
   BASE DE DATOS SQLITE
============================ */

const db = new sqlite3.Database("./escuela.db", (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log("Base de datos SQLite conectada");
    }
});

db.run(`
    CREATE TABLE IF NOT EXISTS alumnos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        edad INTEGER NOT NULL
    )
`);

/* ============================
   MIDDLEWARE JWT
============================ */

function verificarToken(req, res, next) {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        return res.status(401).json({ mensaje: "Token requerido" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ mensaje: "Token inválido" });
    }

    jwt.verify(token, SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ mensaje: "Token no válido o expirado" });
        }

        req.usuario = decoded;
        next();
    });
}

/* ============================
   ENDPOINTS
============================ */

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Autenticación de usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuario:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Retorna token JWT
 *       401:
 *         description: Credenciales incorrectas
 */
app.post("/login", (req, res) => {
    const { usuario, password } = req.body;

    if (usuario === "admin" && password === "1234") {
        const token = jwt.sign(
            { usuario, rol: "admin" },
            SECRET,
            { expiresIn: "1h" }
        );

        return res.json({ token });
    }

    res.status(401).json({ mensaje: "Credenciales incorrectas" });
});

/**
 * @swagger
 * /alumnos:
 *   get:
 *     summary: Obtener todos los alumnos
 *     tags: [Alumnos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de alumnos
 *       401:
 *         description: Token requerido
 */
app.get("/alumnos", verificarToken, (req, res) => {
    db.all("SELECT * FROM alumnos", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(rows);
    });
});

/**
 * @swagger
 * /alumnos/{id}:
 *   get:
 *     summary: Obtener alumno por ID
 *     tags: [Alumnos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Alumno encontrado
 *       404:
 *         description: Alumno no encontrado
 */
app.get("/alumnos/:id", verificarToken, (req, res) => {
    const id = req.params.id;

    db.get("SELECT * FROM alumnos WHERE id = ?", [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            return res.status(404).json({ mensaje: "Alumno no encontrado" });
        }

        res.json(row);
    });
});

/**
 * @swagger
 * /alumnos:
 *   post:
 *     summary: Crear un nuevo alumno
 *     tags: [Alumnos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - edad
 *             properties:
 *               nombre:
 *                 type: string
 *               edad:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Alumno creado correctamente
 */
app.post("/alumnos", verificarToken, (req, res) => {
    const { nombre, edad } = req.body;

    db.run(
        "INSERT INTO alumnos (nombre, edad) VALUES (?, ?)",
        [nombre, edad],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json({
                mensaje: "Alumno creado correctamente",
                id: this.lastID
            });
        }
    );
});

/**
 * @swagger
 * /hola:
 *   get:
 *     summary: Endpoint de prueba
 *     tags: [Test]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mensaje de prueba
 */
app.get("/hola", verificarToken, (req, res) => {
    res.json({ mensaje: "Holis" });
});


app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});


app.listen(3000, "0.0.0.0", () => {
    console.log("Servidor corriendo en red local en puerto 3000");
});