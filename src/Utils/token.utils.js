import jwt from "jsonwebtoken";
import {
  ApplicationException,
  UnAuthorizedException,
  NotFoundException,
} from "./Security/ErrorException/error.exception.js";
import UserRepository from "../DB/Repositories/user.repository.js";
import envConfig from "../Configs/env.config.js";
import { tokenTypeEnum } from "../Common/Enum/token.enum.js";
import { get } from "../Common/Services/redis.services.js";
const userRepo = new UserRepository();
const jwtConfig = envConfig.jwt;

export const generateToken = (bayload, secrt, options) =>
  jwt.sign(bayload, secrt, options);

export const verifyToken = (token, secrt) => jwt.verify(token, secrt);

const getTokenSecret = ({ role, tokenType }) => {
  const roleConfig = jwtConfig[role];

  if (!roleConfig) {
    throw ApplicationException({
      message: "Invalid User Role",
    });
  }

  switch (tokenType) {
    case tokenTypeEnum.Access_Token:
      return roleConfig.access_token_secrt;

    case tokenTypeEnum.Refresh_Token:
      return roleConfig.refresh_token_secrt;

    default:
      throw ApplicationException({
        message: "Invalid Token Type",
      });
  }
};

export const decodeToken = async ({ token, tokenType }) => {
  const data = jwt.decode(token);
  console.log({ data }, data.role);
  if (!data.role) throw ApplicationException({ message: "Role Not Found" });

  const signature = getTokenSecret({
    role: data.role,
    tokenType,
  });

  const decodeData = verifyToken(token, signature);
  const isTokenBlockList = await get(`bl_${tokenType}_${decodeData.jwtid}`);
  console.log({ isTokenBlockList });

  if (isTokenBlockList)
    throw UnAuthorizedException("This Token is revoked try re-lohin");
  const user = await userRepo.findDocumentByID(decodeData.userId);
  if (!user) throw NotFoundException("User  Not Found");
  return { user, tokenData: decodeData };
};
