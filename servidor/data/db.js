import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost/clientes', { useNewUrlParser: true });

mongoose.set('setFindAndModify', false); // para que no salga que no se utliliza esa funcion

//Definir schema de clientes

const clientesSchema = new mongoose.Schema({
	nombre: String,
	apellido: String,
	empresa: String,
	emails: Array,
	edad: Number,
	tipo: String,
	//pedidos: [], DEVOLVER EL CAMBIO AQUI
	pedidos: Array,
	vendedor: mongoose.Types.ObjectId
});

const Clientes = mongoose.model('clientes', clientesSchema);

// Productos

const productosSchema = new mongoose.Schema({
	nombre: String,
	precio: Number,
	stock: Number
});

const Productos = mongoose.model('productos', productosSchema);

//Pedidos

const pedidosSchema = new mongoose.Schema({
	pedido: Array,
	total: Number,
	fecha: Date,
	cliente: mongoose.Types.ObjectId,
	estado: String,
	vendedor: mongoose.Types.ObjectId
});

const Pedidos = mongoose.model('pedidos', pedidosSchema);

// usuarios

const usuariosSchema = new mongoose.Schema({
	usuario: String,
	nombre: String,
	password: String,
	rol: String
});

//hashear los password antes de guardarlos en la base de datos
usuariosSchema.pre('save', function(next) {
	//si el password no esta modificado ejecutar la siguiente funcion
	if (!this.isModified('password')) {
		return next();
	}
	bcrypt.genSalt(10, (err, salt) => {
		if (err) return next(err);
		bcrypt.hash(this.password, salt, (err, hash) => {
			if (err) return err;
			this.password = hash;
			next();
		});
	});
});

const Usuarios = mongoose.model('usuarios', usuariosSchema);

export { Clientes, Productos, Pedidos, Usuarios };
