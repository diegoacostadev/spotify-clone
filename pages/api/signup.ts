import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const salt = bcrypt.genSaltSync();
  const { id, name, lastName, email, password } = req.body;
  let user;

  try {
    user = await prisma.user.create({
      data: {
        name,
        lastName,
        email,
        password: bcrypt.hashSync(password, salt),
      },
    });
  } catch (e) {
    res.status(401);
    res.json({ error: "User already exists" });
    return;
  }

  const token = jwt.sign(
    {
      email,
      id,
      time: Date.now(),
    },
    process.env.MUSIFY_SECRET_KEY,
    { expiresIn: "8h" }
  );

  res.setHeader(
    "Set-Cookie",
    cookie.serialize(process.env.MUSIFY_TOKEN_NAME, token, {
      httpOnly: true,
      maxAge: 8 * 60 * 60,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  );

  res.json(user);
};
