const express     = require("express");
const http        = require("http");
const { Server }  = require("socket.io");
const dotenv      = require("dotenv");
const cors        = require("cors");
const connectDB   = require("./config/db");
const { protect } = require("./middleware/authMiddleware");

// Chargement des variables d'environnement
dotenv.config();

// Connexion a la base de donnees MongoDB
connectDB();

const app    = express();
const server = http.createServer(app);

// Configuration de Socket.io pour le temps reel
const io = new Server(server, {
  cors: {
    origin: "*", // En production, restreindre a l'URL du client
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  },
});

// Stockage des correspondances UserId <-> SocketId
const userSockets = new Map();

io.on("connection", (socket) => {
  // Enregistrement d'un utilisateur sur un socket specifique
  socket.on("register", (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      userSockets.set(userId, socket.id);
      console.log(`Socket enregistre : user_${userId}`);
    }
  });

  // Nettoyage lors de la deconnexion
  socket.on("disconnect", () => {
    userSockets.forEach((sid, uid) => {
      if (sid === socket.id) userSockets.delete(uid);
    });
  });
});

// Middleware pour injecter l'instance Socket.io dans les requetes Express
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middlewares globaux
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// --- Definition des routes de l'API ---
app.use("/api/auth",     require("./routes/authRoutes"));     // Authentification (Login/Register)
app.use("/api/families", require("./routes/familyRoutes"));   // Gestion des groupes/familles
app.use("/api/expenses", require("./routes/expenseRoutes"));   // Gestion des depenses
app.use("/api/purchases", require("./routes/purchaseRoutes")); // Demandes d'achats
app.use("/api/history",  require("./routes/historyRoutes"));  // Historique des transactions
app.use("/api/settings", protect, require("./routes/settingsRoutes")); // Parametres utilisateur (protege)

// Route de base pour verifier que l'API est en ligne
app.get("/", (req, res) => {
  res.json({ message: "API FairSplit operationnelle" });
});

// Demarrage du serveur
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Serveur demarre sur : http://localhost:${PORT}`);
});