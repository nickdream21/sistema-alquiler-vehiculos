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
// MODELOS DE TABLAS (6 TABLAS)
// ================================

// 1. TABLA USUARIOS (para login del sistema)
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
        defaultValue: 1 // 1=activo, 0=inactivo
    }
}, {
    tableName: 'usuarios',
    timestamps: false
});

// 2. TABLA CATEGORIAS_VEHICULO
const CategoriaVehiculo = sequelize.define("categorias_vehiculo", {
    categoria_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    descripcion: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    tarifa_base: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
}, {
    tableName: 'categorias_vehiculo',
    timestamps: false
});

// 3. TABLA CLIENTES
const Cliente = sequelize.define("clientes", {
    cliente_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    cedula: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    telefono: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    direccion: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    fecha_registro: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    estado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1 // 1=activo, 0=inactivo
    }
}, {
    tableName: 'clientes',
    timestamps: false
});

// 4. TABLA VEHICULOS
const Vehiculo = sequelize.define("vehiculos", {
    vehiculo_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    marca: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    modelo: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    anio: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    placa: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true
    },
    color: {
        type: DataTypes.STRING(30),
        allowNull: false
    },
    precio_dia: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'DISPONIBLE' // DISPONIBLE, ALQUILADO, MANTENIMIENTO, INACTIVO
    },
    categoria_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'categorias_vehiculo',
            key: 'categoria_id'
        },
        allowNull: false
    },
    kilometraje: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'vehiculos',
    timestamps: false
});

// 5. TABLA ALQUILERES
const Alquiler = sequelize.define("alquileres", {
    alquiler_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    cliente_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'clientes',
            key: 'cliente_id'
        },
        allowNull: false
    },
    vehiculo_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'vehiculos',
            key: 'vehiculo_id'
        },
        allowNull: false
    },
    fecha_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    fecha_fin: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    fecha_devolucion_real: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    dias_alquiler: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    precio_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    estado_alquiler: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'ACTIVO' // ACTIVO, DEVUELTO, VENCIDO
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'usuarios',
            key: 'usuario_id'
        },
        allowNull: false
    }
}, {
    tableName: 'alquileres',
    timestamps: true // createdAt, updatedAt
});

// 6. TABLA PAGOS
const Pago = sequelize.define("pagos", {
    pago_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    alquiler_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'alquileres',
            key: 'alquiler_id'
        },
        allowNull: false
    },
    monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    fecha_pago: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    metodo_pago: {
        type: DataTypes.STRING(30),
        allowNull: false // EFECTIVO, TARJETA, TRANSFERENCIA, CHEQUE
    },
    comprobante: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'pagos',
    timestamps: false
});

// ================================
// DEFINICIÓN DE RELACIONES
// ================================

// CategoriaVehiculo -> Vehiculos (1:N)
CategoriaVehiculo.hasMany(Vehiculo, {
    foreignKey: 'categoria_id',
    as: 'vehiculos'
});
Vehiculo.belongsTo(CategoriaVehiculo, {
    foreignKey: 'categoria_id',
    as: 'categoria'
});

// Cliente -> Alquileres (1:N)
Cliente.hasMany(Alquiler, {
    foreignKey: 'cliente_id',
    as: 'alquileres'
});
Alquiler.belongsTo(Cliente, {
    foreignKey: 'cliente_id',
    as: 'cliente'
});

// Vehiculo -> Alquileres (1:N)
Vehiculo.hasMany(Alquiler, {
    foreignKey: 'vehiculo_id',
    as: 'alquileres'
});
Alquiler.belongsTo(Vehiculo, {
    foreignKey: 'vehiculo_id',
    as: 'vehiculo'
});

// Usuario -> Alquileres (1:N)
Usuario.hasMany(Alquiler, {
    foreignKey: 'usuario_id',
    as: 'alquileres'
});
Alquiler.belongsTo(Usuario, {
    foreignKey: 'usuario_id',
    as: 'usuario'
});

// Alquiler -> Pagos (1:N)
Alquiler.hasMany(Pago, {
    foreignKey: 'alquiler_id',
    as: 'pagos'
});
Pago.belongsTo(Alquiler, {
    foreignKey: 'alquiler_id',
    as: 'alquiler'
});

// ================================
// ENDPOINTS BÁSICOS
// ================================

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ 
        message: '🚀 Sistema de Alquiler de Vehículos API',
        version: '1.0.0',
        endpoints: {
            auth: 'POST /login',
            categorias: 'GET /categorias',
            vehiculos: 'GET /vehiculos/disponibles',
            clientes: 'GET /clientes',
            reportes: 'GET /reportes/alquileres'
        },
        timestamp: new Date().toISOString()
    });
});

// LOGIN
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

// OBTENER CATEGORÍAS
app.get('/categorias', async (req, res) => {
    try {
        const categorias = await CategoriaVehiculo.findAll({
            order: [['nombre', 'ASC']]
        });
        res.json(categorias);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// OBTENER VEHÍCULOS DISPONIBLES
app.get('/vehiculos/disponibles', async (req, res) => {
    try {
        const vehiculos = await Vehiculo.findAll({
            where: { estado: 'DISPONIBLE' },
            include: [{
                model: CategoriaVehiculo,
                as: 'categoria',
                attributes: ['nombre', 'descripcion']
            }],
            order: [['marca', 'ASC'], ['modelo', 'ASC']]
        });
        res.json(vehiculos);
    } catch (error) {
        console.error('Error al obtener vehículos:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// OBTENER CLIENTES
app.get('/clientes', async (req, res) => {
    try {
        const clientes = await Cliente.findAll({
            where: { estado: 1 },
            order: [['nombre', 'ASC']]
        });
        res.json(clientes);
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// REPORTE DE ALQUILERES
app.get('/reportes/alquileres', async (req, res) => {
    try {
        const alquileres = await Alquiler.findAll({
            include: [
                {
                    model: Cliente,
                    as: 'cliente',
                    attributes: ['nombre', 'cedula', 'telefono']
                },
                {
                    model: Vehiculo,
                    as: 'vehiculo',
                    attributes: ['marca', 'modelo', 'placa'],
                    include: [{
                        model: CategoriaVehiculo,
                        as: 'categoria',
                        attributes: ['nombre']
                    }]
                },
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['nombre_completo']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(alquileres);
    } catch (error) {
        console.error('Error al obtener reporte:', error);
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
        console.log('📋 Tablas creadas: usuarios, categorias_vehiculo, clientes, vehiculos, alquileres, pagos');
    })
    .catch(err => {
        console.error('❌ Error sincronizando modelos:', err);
    });

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌐 Accede a: http://localhost:${PORT}`);
    console.log('🏁 Sistema de Alquiler de Vehículos iniciado');
});

// Exportar modelos para uso en otros archivos
module.exports = {
    sequelize,
    Usuario,
    CategoriaVehiculo,
    Cliente,
    Vehiculo,
    Alquiler,
    Pago
};