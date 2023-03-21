const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { Role } = require('../models');
const RecoveryToken = require('../models/recoveryToken');

const userRegisterService = async (name, email, password) => {
  const role = await Role.findOne({ where: { rol: 'USER_ROL' } });
  if (!role) {
    const error = new Error('No fue encontrado el rol en la BBDD');
    return error;
  }
  const user = await User.create({
    name,
    email,
    password: User.encriptPass(password),
  });
  user.setRole(role);
  return user;
};

const allUsersService = async (limit) => {
  const users = await User.findAndCountAll({
    limit,
    offset: 0,
    where: { deleted: false },
    attributes: ['id', 'name', 'email', 'active', 'deleted', 'roleId'],
    order: [['id', 'ASC']],
  });
  return users;
};

const userByIdService = async (id) => {
  const user = await User.findOne({ where: { id } });
  return user;
};

const usersBannedService = async (limit) => {
  const users = await User.findAndCountAll({
    limit,
    offset: 0,
    where: { deleted: true },
    attributes: ['id', 'name', 'email', 'active', 'deleted', 'roleId'],
    order: [['id', 'ASC']],
  });
  return users;
};

const updateUserService = async (id, email, name, password, status) => {
  const user = await User.update(
    {
      email,
      name,
      password,
      status,
    },
    { where: { id } },
  );
  return user;
};

const disableUserService = async (id) => {
  const findUser = await User.findOne({ where: { id } });
  const user = await User.update(
    { deleted: !findUser.deleted },
    { where: { id } },
  );
  return user;
};

const forgotPasswordService = async (email) => {
  const user = await User.findOne({ where: { email } });
  const token = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
  const recoveryToken = await RecoveryToken.create({ token });
  await recoveryToken.setUser(user);
  return token;
};

const resetPasswordService = async (token, password) => {
  const recoveryToken = await RecoveryToken.findOne({ where: { token } });
  const user = await User.findByPk(recoveryToken.userId);
  const updatePassword = await user.update({ password: User.encriptPass(password) });
  await recoveryToken.destroy();
  return updatePassword;
};

module.exports = {
  userRegisterService,
  allUsersService,
  userByIdService,
  usersBannedService,
  updateUserService,
  disableUserService,
  forgotPasswordService,
  resetPasswordService,
};
