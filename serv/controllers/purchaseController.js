const PurchaseRequest = require("../models/PurchaseRequest");
const Family = require("../models/Family");
const Notification = require("../models/Notification");

// Helper to check membership
const checkMembership = async (familyId, userId) => {
  const family = await Family.findById(familyId);
  if (!family) return null;
  const isMember = family.members.some(
    (m) => m.user_id.toString() === userId.toString()
  );
  return isMember ? family : null;
};

// @GET /api/purchases?familyId=...
exports.getPurchases = async (req, res) => {
  try {
    const { familyId } = req.query;
    if (!familyId) return res.status(400).json({ message: "familyId est requis" });

    const family = await checkMembership(familyId, req.user._id);
    if (!family) return res.status(403).json({ message: "Acces refuse au groupe" });

    const purchases = await PurchaseRequest.find({ familyId })
      .populate("requestedBy", "name")
      .populate("acceptedBy", "name")
      .sort({ createdAt: -1 });

    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/purchases
exports.createPurchase = async (req, res) => {
  try {
    const { productName, estimatedPrice, urgency, storeLocation, familyId } = req.body;

    const family = await checkMembership(familyId, req.user._id);
    if (!family) return res.status(403).json({ message: "Acces refuse au groupe" });

    const purchase = await PurchaseRequest.create({
      productName,
      estimatedPrice,
      urgency: urgency || "medium",
      storeLocation: storeLocation || "",
      familyId,
      requestedBy: req.user._id,
    });

    const populated = await PurchaseRequest.findById(purchase._id).populate("requestedBy", "name");

    // Notification aux autres membres (optionnel - ne doit pas bloquer la reponse)
    try {
      const otherMembers = (family.members || []).filter(m => m.user_id && m.user_id.toString() !== req.user._id.toString());
      if (otherMembers.length > 0) {
        const notifications = otherMembers.map(m => ({
          to: m.user_id,
          from: req.user._id,
          family: familyId,
          type: "purchase_request",
          message: `${req.user?.name || "Un membre"} a demande d'acheter "${productName}".`,
        }));
        
        // Utilisation de validateBeforeSave: false car l'enum peut ne pas etre a jour dans le cache Mongoose
        const createdNotifs = await Notification.insertMany(notifications, { validateBeforeSave: false });
        
        // Emission Socket.io si disponible
        if (req.io) {
          createdNotifs.forEach(notif => {
            try {
              req.io.to(`user_${notif.to}`).emit("notification", {
                _id: notif._id,
                type: notif.type,
                message: notif.message,
                family: { _id: familyId, name: family.name },
                createdAt: notif.createdAt,
              });
            } catch (socketErr) {
              console.error("Socket Emission Error (createPurchase):", socketErr);
            }
          });
        }
      }
    } catch (notifError) {
      console.error("Purchase Notification Error:", notifError);
      // On continue pour renvoyer la reponse 201 car la demande est creee
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error("Create Purchase Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/purchases/:id/accept
exports.acceptPurchase = async (req, res) => {
  try {
    const purchase = await PurchaseRequest.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: "Demande introuvable" });

    const family = await checkMembership(purchase.familyId, req.user._id);
    if (!family) return res.status(403).json({ message: "Accès refusé" });

    if (purchase.status !== "pending") {
      return res.status(400).json({ message: "Cette demande ne peut plus être acceptée" });
    }

    purchase.status = "accepted";
    purchase.acceptedBy = req.user._id;
    await purchase.save();

    const updated = await PurchaseRequest.findById(purchase._id)
      .populate("requestedBy", "name")
      .populate("acceptedBy", "name");

    // Notifier le demandeur
    try {
      const notif = await Notification.create([{
        to: purchase.requestedBy,
        from: req.user._id,
        family: purchase.familyId,
        type: "purchase_accepted",
        message: `${req.user?.name || "Un membre"} a accepté votre demande pour "${purchase.productName}".`,
      }], { validateBeforeSave: false });
      
      const createdNotif = notif[0];

      if (req.io) {
        try {
          req.io.to(`user_${purchase.requestedBy}`).emit("notification", {
            _id: createdNotif._id,
            type: createdNotif.type,
            message: createdNotif.message,
            family: { _id: purchase.familyId, name: family.name },
            createdAt: createdNotif.createdAt,
          });
        } catch (socketErr) {
          console.error("Socket Emission Error (acceptPurchase):", socketErr);
        }
      }
    } catch (notifError) {
      console.error("Accept Purchase Notification Error:", notifError);
    }

    res.json(updated);
  } catch (error) {
    console.error("Accept Purchase Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/purchases/:id/complete
exports.completePurchase = async (req, res) => {
  try {
    const purchase = await PurchaseRequest.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: "Demande introuvable" });

    if (purchase.acceptedBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Seul celui qui a accepté peut terminer" });
    }

    purchase.status = "completed";
    purchase.completedAt = new Date();
    await purchase.save();

    const updated = await PurchaseRequest.findById(purchase._id)
      .populate("requestedBy", "name")
      .populate("acceptedBy", "name");

    // Notifier le demandeur
    try {
      const family = await Family.findById(purchase.familyId);
      const notif = await Notification.create([{
        to: purchase.requestedBy,
        from: req.user._id,
        family: purchase.familyId,
        type: "purchase_completed",
        message: `${req.user?.name || "Un membre"} a acheté "${purchase.productName}".`,
      }], { validateBeforeSave: false });
      
      const createdNotif = notif[0];

      if (req.io) {
        try {
          req.io.to(`user_${purchase.requestedBy}`).emit("notification", {
            _id: createdNotif._id,
            type: createdNotif.type,
            message: createdNotif.message,
            family: { _id: purchase.familyId, name: family?.name || "Groupe" },
            createdAt: createdNotif.createdAt,
          });
        } catch (socketErr) {
          console.error("Socket Emission Error (completePurchase):", socketErr);
        }
      }
    } catch (notifError) {
      console.error("Complete Purchase Notification Error:", notifError);
    }

    res.json(updated);
  } catch (error) {
    console.error("Complete Purchase Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/purchases/:id
exports.deletePurchase = async (req, res) => {
  try {
    const purchase = await PurchaseRequest.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: "Demande introuvable" });

    if (purchase.requestedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Seul le demandeur peut supprimer" });
    }

    await PurchaseRequest.findByIdAndDelete(req.params.id);
    res.json({ message: "Demande supprimée" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
