import jwt from "jsonwebtoken";
import UserModel from "../models/UserModel.js";

const checkAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ ok: false, message: "Not authorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await UserModel.findById(decoded.id).select("-passwordHash");
    if (!user) return res.status(401).json({ ok: false, message: "User not found" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ ok: false, message: "Invalid or expired token" });
  }
};

export default checkAuth;
