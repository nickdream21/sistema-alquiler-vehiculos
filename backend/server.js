require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require("sequelize");

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a la base de datos
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_SERVER,
    dialect: "mssql",
    dialectOptions: {
        options: { 
            encrypt: false,
            trustServerCertificate: true 
        }
    },
});

// ================================
// MODELOS BÁSICOS (Por ahora solo usuarios)
// ================================

const Usuario = sequelize.define("usuarios", {
    usuario_id: {
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true, 
        allowNull: false 
    },
    username: {
        type: DataTypes.STRING(50),  
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING(100),  
        allowNull: false 
    },
    nombre_completo: {
        type: DataTypes.STRING(100),  
        allowNull: false 
    },
    estado: {
        type: DataTypes.INTEGER, 
        allowNull: false,
        defaultValue: 1
    }
}, {
    tableName: 'usuarios',
    timestamps: false
});

// ================================
// RUTAS BÁSICAS
// ================================

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ 
        message: 'Backend del Sistema de Alquiler de Vehículos funcionando correctamente!',
        timestamp: new Date().toISOString()
    });
});

// Login básico
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const usuario = await Usuario.findOne({
            where: { username: username, estado: 1 }
        });

        if (!usuario) {
            return res.status(400).json({ error: 'Usuario no encontrado' });
        }

        if (password !== usuario.password) {
            return res.status(400).json({ error: 'Contraseña incorrecta' });
        }

        const token = jwt.sign(
            { id: usuario.usuario_id, username: usuario.username }, 
            process.env.JWT_SECRET || 'secreto_alquiler', 
            { expiresIn: '8h' }
        );

        res.json({ 
            token, 
            usuario: {
                id: usuario.usuario_id,
                username: usuario.username,
                nombre: usuario.nombre_completo
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// ================================
// CONEXIÓN Y SINCRONIZACIÓN
// ================================

// Verificar conexión
sequelize.authenticate()
    .then(() => console.log("✅ Conexión exitosa a SQL Server"))
    .catch(err => console.error("❌ Error de conexión:", err));

// Sincronizar modelos con la base de datos
sequelize.sync({ alter: true })
    .then(() => {
        console.log('✅ Modelos sincronizados con la base de datos');
    })
    .catch(err => {
        console.error('❌ Error sincronizando modelos:', err);
    });

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌐 Accede a: http://localhost:${PORT}`);
});

module.exports = app;