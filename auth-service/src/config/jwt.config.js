import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const RESET_PASSWORD_SECRET = process.env.RESET_PASSWORD_SECRET;

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m"
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d"
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};

export const generateResetPasswordToken = (payload) => {
  return jwt.sign(payload, RESET_PASSWORD_SECRET, {
    expiresIn: process.env.RESET_PASSWORD_EXPIRES_IN || "10m"
  });
};

export const verifyResetPasswordToken = (token) => {
  return jwt.verify(token, RESET_PASSWORD_SECRET);
};