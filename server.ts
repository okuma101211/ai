import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import Stripe from "stripe";
import * as admin from "firebase-admin";

const db = new Database("analytics.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    input_content TEXT,
    target_country TEXT,
    target_generation TEXT,
    target_gender TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analytics_id INTEGER,
    is_accurate BOOLEAN,
    feedback_text TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

let firebaseAdminInitialized = false;
function getFirebaseAdmin() {
  if (!firebaseAdminInitialized) {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      } else {
        // Fallback to default credentials if available
        admin.initializeApp();
      }
      firebaseAdminInitialized = true;
    } catch (error) {
      console.error("Failed to initialize Firebase Admin:", error);
      throw error;
    }
  }
  return admin;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Stripe webhook needs raw body
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    try {
      const stripe = getStripe();
      const sig = req.headers["stripe-signature"];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!sig || !endpointSecret) {
        return res.status(400).send("Missing signature or secret");
      }

      const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        
        if (userId) {
          const adminApp = getFirebaseAdmin();
          const userRef = adminApp.firestore().collection("users").doc(userId);
          
          if (session.metadata?.type === "subscription") {
            await userRef.update({ plan: "pro" });
          } else if (session.metadata?.type === "credits") {
            const creditsToAdd = parseInt(session.metadata.credits || "0", 10);
            await userRef.update({
              credits: admin.firestore.FieldValue.increment(creditsToAdd)
            });
          }
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Stripe webhook error:", error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });

  app.use(express.json());

  app.post("/api/stripe/create-checkout-session", async (req, res) => {
    try {
      const { priceId, userId, type, credits } = req.body;
      const stripe = getStripe();

      const baseUrl = (process.env.APP_URL || req.headers.origin || "").replace(/\/$/, "");

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: type === "subscription" ? "subscription" : "payment",
        success_url: `${baseUrl}/dashboard?success=true`,
        cancel_url: `${baseUrl}/pricing?canceled=true`,
        client_reference_id: userId,
        metadata: {
          type,
          credits: credits ? credits.toString() : undefined
        }
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API routes FIRST
  app.post("/api/analytics", (req, res) => {
    try {
      const { inputContent, targetCountry, targetGeneration, targetGender } = req.body;
      const stmt = db.prepare(
        "INSERT INTO analytics (input_content, target_country, target_generation, target_gender) VALUES (?, ?, ?, ?)"
      );
      const info = stmt.run(inputContent, targetCountry, targetGeneration, targetGender);
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
      console.error("Error saving analytics:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/feedback", (req, res) => {
    try {
      const { analyticsId, isAccurate, feedbackText } = req.body;
      const stmt = db.prepare(
        "INSERT INTO feedback (analytics_id, is_accurate, feedback_text) VALUES (?, ?, ?)"
      );
      stmt.run(analyticsId, isAccurate, feedbackText || null);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving feedback:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
