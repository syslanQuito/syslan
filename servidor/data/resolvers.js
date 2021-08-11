//Resolver, el resolver del query es la respuesta del servidor
import mongoose from 'mongoose';
import Cliente, { Clientes } from './db';
import { rejects } from 'assert';
import Producto, { Productos } from './db';
import { Pedidos, Usuarios } from './db';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

const ObjectId = mongoose.Types.ObjectId;

dotenv.config({ path: 'variables.env' });

const crearToken = (usuarioLogin, secreto, expiresIn) => {
	const { usuario } = usuarioLogin;
	return jwt.sign({ usuario }, secreto, { expiresIn });
};

export const resolvers = {
	Query: {
		getCliente: (root, { id }) => {
			console.log('ID', id);
			return new Promise((resolve, object) => {
				Clientes.findById(id, (error, cliente) => {
					if (error) rejects(error);
					else resolve(cliente);
				});
			});
		},
		totalClientes: (root) => {
			return new Promise((resolve, object) => {
				Clientes.countDocuments({}, (error, count) => {
					if (error) rejects(error);
					else resolve(count);
				});
			});
		},

		getClientes: (root, { limite, offset, vendedor }) => {
			let filtro;

			if (vendedor) {
				filtro = { vendedor: new ObjectId(vendedor) };
			}
			return Clientes.find(filtro).limit(limite).skip(offset);
		},

		obtenerProductos: (root, { limite, offset, stock }) => {
			let filtro;
			if (stock) {
				filtro = { stock: { $gt: 0 } };
			}

			return Productos.find(filtro).limit(limite).skip(offset);
		},

		obtenerPedidos: (root, { cliente }) => {
			return new Promise((resolve, object) => {
				Pedidos.find({ cliente: cliente }, (error, pedido) => {
					if (error) rejects(error);
					else resolve(pedido);
				});
			});
		},

		obtenerProducto: (root, { id }) => {
			return new Promise((resolve, object) => {
				Productos.findById(id, (error, producto) => {
					if (error) rejects(error);
					else resolve(producto);
				});
			});
		},
		topClientes: (root) => {
			return new Promise((resolve, object) => {
				//FILTRAR LOS TOP 10
				Pedidos.aggregate(
					[
						{
							$match: { estado: 'COMPLETADO' }
						},
						{
							$group: {
								_id: '$cliente',
								total: { $sum: '$total' }
							}
						},

						{
							$lookup: {
								from: 'clientes',
								localField: '_id',
								foreignField: '_id',
								as: 'cliente'
							}
						},
						{
							$sort: { total: -1 }
						},
						{
							$limit: 10
						}
					],
					(error, resultado) => {
						if (error) rejects(error);
						else resolve(resultado);
					}
				);
			});
		},
		obtenerUsuario: (root, args, { usuarioActual }) => {
			if (!usuarioActual) {
				return null;
			}
			console.log(usuarioActual);
			//obtener el usuario actual del request del jwt verificado
			const usuario = Usuarios.findOne({ usuario: usuarioActual.usuario });
			return usuario;
		},
		topVendedores: (root) => {
			return new Promise((resolve, object) => {
				//FILTRAR LOS TOP 10
				Pedidos.aggregate(
					[
						{
							$match: { estado: 'COMPLETADO' }
						},
						{
							$group: {
								_id: '$vendedor',
								total: { $sum: '$total' }
							}
						},

						{
							$lookup: {
								from: 'usuarios',
								localField: '_id',
								foreignField: '_id',
								as: 'vendedor'
							}
						},
						{
							$sort: { total: -1 }
						},
						{
							$limit: 10
						}
					],
					(error, resultado) => {
						if (error) rejects(error);
						else resolve(resultado);
					}
				);
			});
		}
	},

	Mutation: {
		crearCliente: (root, { input }) => {
			const nuevoCliente = new Clientes({
				nombre: input.nombre,
				apellido: input.apellido,
				empresa: input.empresa,
				emails: input.emails,
				edad: input.edad,
				tipo: input.tipo,
				vendedor: input.vendedor
			});
			if (input.pedidos != null && input.pedidos.length > 0) {
				nuevoCliente.pedidos = input.pedidos;
			}
			nuevoCliente.id = nuevoCliente._id;
			return new Promise((resolve, object) => {
				nuevoCliente.save((error) => {
					if (error) rejects(error);
					else resolve(nuevoCliente);
				});
			});
		},

		actualizarCliente: (root, { input }) => {
			console.log('entra');
			console.log(input);
			return new Promise((resolve, object) => {
				Clientes.findOneAndUpdate({ _id: input.id }, input, { new: true }, (error, cliente) => {
					if (error) rejects(error);
					else resolve(cliente);
				});
			});
		},

		eliminarCliente: (root, { id }) => {
			return new Promise((resolve, object) => {
				Clientes.findOneAndDelete({ _id: id }, (error) => {
					if (error) rejects(error);
					else resolve('El Cliente se Eliminó Correctamente');
				});
			});
		},

		nuevoProducto: (root, { input }) => {
			const nuevoProducto = new Productos({
				nombre: input.nombre,
				precio: input.precio,
				stock: input.stock
			});
			// mongo db crea el ID que se asigna al objeto
			nuevoProducto.id = nuevoProducto._id;

			return new Promise((resolve, objetc) => {
				nuevoProducto.save((error) => {
					if (error) rejects(error);
					else resolve(nuevoProducto);
				});
			});
		},
		actualizarProducto: (root, { input }) => {
			return new Promise((resolve, producto) => {
				Productos.findOneAndUpdate({ _id: input.id }, input, { new: true }, (error, producto) => {
					if (error) rejects(error);
					else resolve(producto);
				});
			});
		},

		eliminarProducto: (root, { id }) => {
			return new Promise((resolve, producto) => {
				Productos.findOneAndDelete({ _id: id }, (error) => {
					if (error) rejects(error);
					else resolve('El Producto se Eliminó Correctamente');
				});
			});
		},

		nuevoPedido: (root, { input }) => {
			const nuevoPedido = new Pedidos({
				pedido: input.pedido,
				total: input.total,
				fecha: new Date(),
				cliente: input.cliente,
				estado: 'PENDIENTE',
				vendedor: input.vendedor
			});
			nuevoPedido.id = nuevoPedido._id;
			return new Promise((resolve, object) => {
				nuevoPedido.save((error) => {
					if (error) rejects(error);
					else resolve(nuevoPedido);
				});
			});
		},

		actualizarEstado: (root, { input }) => {
			return new Promise((resolve, object) => {
				//recorrer y actualizar la cantidad de productos en base al estado del pedido

				const { estado } = input;
				let instruccion;
				if (estado === 'COMPLETADO') {
					instruccion = '-';
				} else if (estado === 'CANCELADO') {
					instruccion = '+';
				}

				input.pedido.forEach((pedido) => {
					Productos.updateOne(
						{ _id: pedido.id },
						{
							$inc: { stock: `${instruccion}${pedido.cantidad}` } //le resta o suma al stock dependiendo de si esta cancelado o aprobado
						},
						function(error) {
							if (error) return new Error(error);
						}
					);
				});
				Pedidos.findOneAndUpdate({ _id: input.id }, input, { new: true }, (error) => {
					if (error) rejects(error);
					else resolve('Se actualizó correctamente');
				});
			});
		},
		crearUsuario: async (root, { usuario, nombre, password, rol }) => {
			//revisar si un usuario contiene el mismo password
			const existeUsuario = await Usuarios.findOne({ usuario });
			if (existeUsuario) {
				throw new Error('El usuario ya existe');
			}

			const nuevoUsuario = await new Usuarios({
				usuario,
				nombre,
				password,
				rol
			}).save();
			return 'Creado Correctamente';
		},
		autenticarUsuario: async (root, { usuario, password }) => {
			const nombreUsuario = await Usuarios.findOne({ usuario });

			if (!nombreUsuario) {
				throw new Error('Usuario no encontrado');
			}
			const passwordCorrecto = await bcrypt.compare(password, nombreUsuario.password);
			//si el password es incorrecto
			if (!passwordCorrecto) {
				throw new Error('Password Incorrecto');
			}
			return {
				token: crearToken(nombreUsuario, process.env.SECRETO, '1hr') // tiempo de sesion
			};
		}
	}
};
export default resolvers;
