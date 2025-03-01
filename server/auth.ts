import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Middleware to check if user is from Gol Supermarket
function isSupermarket(req: Express.Request, res: Express.Response, next: Function) {
  if (req.isAuthenticated() && req.user.role === 'supermarket') {
    return next();
  }
  res.status(403).json({ message: "Apenas usuários do Gol Supermarket podem realizar esta ação" });
}

// Middleware to check if user is from Hyannis store (main store)
function isHyannisStore(req: Express.Request, res: Express.Response, next: Function) {
  if (req.isAuthenticated() && req.user.role === 'supermarket' && req.user.storeId === 1) {
    return next();
  }
  res.status(403).json({ message: "Apenas a loja de Hyannis pode realizar esta ação" });
}

// Middleware to check if user is a store manager
function isStoreManager(req: Express.Request, res: Express.Response, next: Function) {
  if (req.isAuthenticated() && req.user.role === 'supermarket' && req.user.storeId) {
    return next();
  }
  res.status(403).json({ message: "Apenas gerentes de loja podem realizar esta ação" });
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'temporary-secret-for-development',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        console.log("Login attempt:", { username, userFound: !!user });

        if (!user) {
          return done(null, false, { message: "User not found" });
        }

        const isValid = await comparePasswords(password, user.password);
        console.log("Password validation:", { isValid });

        if (!isValid) {
          return done(null, false, { message: "Invalid password" });
        }

        return done(null, user);
      } catch (error) {
        console.error("Authentication error:", error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log("Serializing user:", user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      console.log("Deserializing user:", { id, userFound: !!user });
      done(null, user);
    } catch (error) {
      console.error("Deserialization error:", error);
      done(error);
    }
  });

  // Nova rota para registro de usuários das lojas
  app.post("/api/register/store", isHyannisStore, async (req, res) => {
    try {
      const { username, password, storeId } = req.body;

      // Verificar se já existe um usuário com este username
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username já existe" });
      }

      // Verificar se a loja existe
      const store = await storage.getStore(storeId);
      if (!store) {
        return res.status(404).json({ message: "Loja não encontrada" });
      }

      // Não permitir criar usuário para a loja de Hyannis (ID 1)
      if (storeId === 1) {
        return res.status(400).json({ message: "Não é permitido criar usuários para a loja de Hyannis por esta rota" });
      }

      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        role: 'supermarket',
        storeId
      });

      res.status(201).json(user);
    } catch (error) {
      console.error("Erro ao criar usuário da loja:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
    // Rota especial para o primeiro usuário (Gol Supermarket)
  app.post("/api/register/supermarket", async (req, res, next) => {
    const users = await storage.getUsers();
    if (users.length > 0) {
      return res.status(403).send("Gol Supermarket user already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
      role: 'supermarket'
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  // Nova rota para registro de usuários distribuidores
  app.post("/api/register/distributor", async (req, res, next) => {
    try {
      const { username, password, distributorId } = req.body;

      // Verificar se já existe um usuário com este username
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Verificar se o distribuidor existe
      const distributor = await storage.getDistributor(distributorId);
      if (!distributor) {
        return res.status(404).json({ message: "Distributor not found" });
      }

      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        role: 'distributor',
        distributorId
      });

      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating distributor user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

export { isSupermarket, isHyannisStore, isStoreManager, isDistributor };