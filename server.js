
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const jwt = require('jsonwebtoken');
console.log("JWT:", jwt);

const app = express();
app.use(cors());
app.use(express.json());



const db = new sqlite3.Database('./escuela.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Base de datos SQLite conectada');
    }
});

db.run(`
    CREATE TABLE IF NOT EXISTS alumnos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        edad INTEGER NOT NULL
    )
`);


app.get('/alumnos', (req, res) => {
    db.all("SELECT * FROM alumnos", [], (err, rows) => {
        if (err) {
            res.status(500).json(err.message);
        } else {
            res.json(rows);
        }
    });
});

app.get('/alumnos/:id', (req, res) => {
    const id = req.params.id;

    db.get("SELECT * FROM alumnos WHERE id = ?", [id], (err, row) => {
        if (err) {
            res.status(500).json(err.message);
        } else if (!row) {
            res.status(404).json({ mensaje: "Alumno no encontrado" });
        } else {
            res.json(row);
        }
    });
});

app.get('/hola', (req, res) => {
    
    res.json({mensaje:"Holis"})

});

app.post('/alumnos', (req, res) => {
    const { nombre, edad } = req.body;

    db.run(
        "INSERT INTO alumnos (nombre, edad) VALUES (?, ?)",
        [nombre, edad],
        function (err) {
            if (err) {
                res.status(500).json(err.message);
            } else {
                res.json({
                    mensaje: "Alumno creado correctamente",
                    id: this.lastID
                });
            }
        }
    );
});

app.post('/login', (req, res) => {
    const { usuario, password } = req.body;

    if (usuario === "admin" && password === "1234") {
        const token = jwt.sign({ usuario, rol: "admin" }, SECRET, { expiresIn: "1h" });
        return res.json({ token });
    }

    res.status(401).json({ mensaje: "Credenciales incorrectas" });
});


app.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
});
