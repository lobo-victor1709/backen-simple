import { connect } from "../databases";
import jwt from "jsonwebtoken";

const claveSecreta = process.env.SECRET_KEY;

export const logIn = async (req, res) => {
  try {
    const { dni, password } = req.body;
    //Obtiene los datos de la request

    //obtener el objeto conezion -paso2
    const cnn = await connect();

    const q = `SELECT past FROM alumno WHERE dni=? `;
    const value = [dni];

    const [result] = await cnn.query(q, value);

    //console.log("resultado weon", result);

    if (result.length > 0) {
      //El usuario existe
      //comparar las contraeñas
      if (result[0].past === password) {
        //El usuario existe y la contraeña es igual
        //crear un token
        const token = getToken({ dni: dni });
        //enviar al front

        return res
          .status(200)
          .json({ message: "correcto", success: true, token: token });
      } else {
        return res
          .status(400)
          .json({ message: "user no existe :(", success: false });
      }
    } else {
      //El usuario no existe
      return res
        .status(400)
        .json({ message: "error al acceder", success: false });
    }

    //console.log("login", result);
    //Hace la peticion al login

    //res.json({});
  } catch (error) {
    res.status(500).json({ message: "fallo en el catch", error: error });
  }
};

const validate = async (campo, valor, tabla, cnn) => {
  //q guarda el query
  const q = `SELECT * FROM ${tabla} WHERE ${campo}=? `;
  const value = [valor];

  const [result] = await cnn.query(q, value);

  //console.log("validate: ", result[0].lenght);

  return result.lenght === 1;
};

//crear usuarios desde el sigup
export const createUsers = async (req, res) => {
  try {
    //establecer la conexion a la base de datos -> instanciando un objeto conexion
    const cnn = await connect();
    //obtener lo que envia el front
    const { dni, nombre, contra } = req.body;

    const userExist = await validate("dni", dni, "alumno", cnn);

    console.log("userexist", userExist);
    if (userExist)
      return res.status(400).json({ message: "el usuario ya existe" });

    /*if (validate("dni", dni, "alumno", cnn)) {
      console.log("ok");
    } else {
      console.log("no ok");
    } es una forma de hacer la condicion de usuario existente*/

    //validar existencia del dnni
    //Insertar en la base de datos
    const [result] = await cnn.query(
      "INSERT INTO alumno (dni,nombre,past) VALUE(?,?,?)",
      [dni, nombre, contra]
    );

    if (result.affectedRows === 1) {
      return res
        .status(200)
        .json({ message: "se creo el usuario", succes: true });
    } else {
      return res
        .status(500)
        .json({ message: "El usuario no se creo", succes: false });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

//funcion para auntenticar el token
//Se conoce como middleware (intermediario)
export const auth = (req, res, next) => {
  //obtener el token desde la peticion
  const tokenFront = req.headers["auth"];

  //Verificar que hay un token
  if (!tokenFront) return res.status(400).json({ message: "No hay token" }); //Se ejecutrara si no existe token en la peticion

  //Si hay token debe validar
  jwt.verify(tokenFront, claveSecreta, (error, payload) => {
    if (error) {
      //SI el token no es valido
      return res.status(400).json({ message: "EL token no es valido" });
    } else {
      //El token es valido
      req.payload = payload;
      next();
    }
  });
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Nueva funcion que me de las listas de las materias
export const getMateriasbyDni = async (req, res) => {
  //Vamos a simular el acceso a la bd para obtener la lista de materias de un alumno que esta cursando

  //Obtener el dni de la request
  const dni = req.payload.dni;
  const cnn = await connect();
  const q = `SELECT id, nombre FROM materias WHERE alumno_dni=?`;

  console.log(dni);
  //acceder a la bae de datos
  const materias = [
    { id: 1, nombre: "so2" },
    { id: 2, nombre: "web" },
    { id: 3, nombre: "arquitectura" },
  ];
  return res.status(200).json(materias);
};

//Funciones privadas
//Funcion qued debuelve el token
const getToken = (payload) => {
  const token = jwt.sign(payload, claveSecreta, { expiresIn: "1m" });
  return token;
};

////////////////////////////////////////////////////////////////////////////////////////

//Crear materias una materia

//carga las materias
export const addMateria = async (req, res) => {
  try {
    //obtener las conexion a la base de datos
    const cnn = await connect();

    //obtiene los datos de la materia desde el cuerpo hasta la solicitud
    const { nombre, descripcion } = req.body;

    //validar si la meteria  ya existe
    const materiaExist = await validate("nombre", nombre, "materia", cnn);

    if (materiaExist) {
      return res.status(400).json({ message: "La materia ya existe" });
    }

    //insertar la nueva materia en la base de datos
    const [result] = await cnn.query(
      "INSERT INTO materia (nombre,descripcion) VALUES (?,?)",
      [nombre, descripcion]
    );

    if (result.affectedRows === 1) {
      return res.status(200).json({ message: "Materia creada", success: true });
    } else {
      return res
        .status(500)
        .json({ message: "Error al crear la materia", success: false });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "error, no paso por aca", success: false });
  }
};
