import express from "express";
import { createServer as createViteServer } from "vite";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import db from "./db.ts";
import fs from "fs";

const JWT_SECRET = process.env.JWT_SECRET || "moonstone-secret-key";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());
  app.use("/uploads", express.static(uploadDir));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Request logger
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      console.log(`[API Request] ${req.method} ${req.path}`);
    }
    next();
  });

  // --- API ROUTES ---

  // Auth
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { first_name, last_name, email, phone, address, password } = req.body;
      const username = email.split("@")[0] + Math.floor(Math.random() * 1000);
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = db.prepare(`
        INSERT INTO users (first_name, last_name, email, username, phone, address, password, profile_picture)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(first_name, last_name, email, username, phone, address, hashedPassword, null);

      const userId = result.lastInsertRowid;
      const accountNumber = "MS" + Math.floor(1000000000 + Math.random() * 9000000000);
      
      // Generate Virtual Card
      const cardNumber = "4" + Math.floor(100000000000000 + Math.random() * 900000000000000).toString();
      const cardExpiry = "12/29";
      const cardCvv = Math.floor(100 + Math.random() * 900).toString();

      db.prepare(`
        INSERT INTO accounts (user_id, account_number, card_number, card_expiry, card_cvv) 
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, accountNumber, cardNumber, cardExpiry, cardCvv);

      res.status(201).json({ message: "Registration successful. Account pending approval." });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { login, password } = req.body; // login can be email or username
    const user: any = db.prepare("SELECT * FROM users WHERE email = ? OR username = ?").get(login, login);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(403).json({ error: "Account locked due to multiple failed attempts. Please try again later." });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      // Increment failed attempts
      const newAttempts = (user.failed_attempts || 0) + 1;
      if (newAttempts >= 5) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 mins lock
        db.prepare("UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?").run(newAttempts, lockUntil, user.id);
        return res.status(403).json({ error: "Too many failed attempts. Account locked for 30 minutes." });
      } else {
        db.prepare("UPDATE users SET failed_attempts = ? WHERE id = ?").run(newAttempts, user.id);
        return res.status(401).json({ error: `Invalid credentials. ${5 - newAttempts} attempts remaining.` });
      }
    }

    if (user.status === "disabled") {
      return res.status(403).json({ error: "Account disabled" });
    }

    // Reset failed attempts on success
    db.prepare("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?").run(user.id);

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, user: { id: user.id, first_name: user.first_name, last_name: user.last_name, role: user.role, profile_picture: user.profile_picture } });
  });

  // Middleware for Auth
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    next();
  };

  // Maintenance Mode Middleware
  app.use(async (req: any, res, next) => {
    // Skip check for admin routes and auth routes
    if (req.path.startsWith("/api/admin") || req.path.startsWith("/api/auth/login")) {
      return next();
    }

    const maintenance = db.prepare("SELECT value FROM system_settings WHERE key = 'maintenance_mode'").get() as any;
    if (maintenance?.value === 'on') {
      // Check if user is admin
      const token = req.headers.authorization?.split(" ")[1];
      if (token) {
        try {
          const decoded: any = jwt.verify(token, JWT_SECRET);
          if (decoded.role === 'admin') return next();
        } catch {}
      }
      return res.status(503).json({ error: "System is under maintenance. Please try again later." });
    }
    next();
  });

  // Customer Routes
  app.get("/api/customer/dashboard", authenticate, (req: any, res) => {
    const account: any = db.prepare("SELECT * FROM accounts WHERE user_id = ?").get(req.user.id);
    const transactions = db.prepare("SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC LIMIT 10").all(account.id);
    res.json({ account, transactions });
  });

  app.post("/api/customer/transfer", authenticate, (req: any, res) => {
    const { amount, recipient_account, recipient_name, bank_name, description, pin, type } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    
    if (user.transfer_pin && user.transfer_pin !== pin) {
      return res.status(400).json({ error: "Invalid Transfer PIN" });
    }

    const senderAccount: any = db.prepare("SELECT * FROM accounts WHERE user_id = ?").get(req.user.id);
    if (senderAccount.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const ref = (type === 'international' ? "INT" : "TXN") + Date.now();
    const fullDescription = `${type === 'international' ? 'International' : 'Local'} Transfer to ${recipient_name} (${bank_name} - ${recipient_account}): ${description}`;
    
    db.prepare(`
      INSERT INTO transactions (account_id, type, amount, description, status, reference)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(senderAccount.id, "transfer_out", amount, fullDescription, "pending", ref);

    res.json({ message: "Transfer initiated and pending admin approval." });
  });

  app.get("/api/customer/loans", authenticate, (req: any, res) => {
    const loans = db.prepare("SELECT * FROM loans WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    res.json(loans);
  });

  app.post("/api/customer/loans", authenticate, (req: any, res) => {
    const { amount, purpose } = req.body;
    db.prepare("INSERT INTO loans (user_id, amount, purpose) VALUES (?, ?, ?)").run(req.user.id, amount, purpose);
    res.json({ message: "Loan application submitted." });
  });

  app.post("/api/customer/loans/:id/repay", authenticate, (req: any, res) => {
    const { amount } = req.body;
    const loan: any = db.prepare("SELECT * FROM loans WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
    if (!loan || loan.status !== 'approved') return res.status(400).json({ error: "Invalid loan" });

    const account: any = db.prepare("SELECT * FROM accounts WHERE user_id = ?").get(req.user.id);
    if (account.balance < amount) return res.status(400).json({ error: "Insufficient balance" });

    db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(amount, account.id);
    db.prepare("UPDATE loans SET status = 'paid' WHERE id = ?").run(req.params.id);
    
    const ref = "REPAY" + Date.now();
    db.prepare(`
      INSERT INTO transactions (account_id, type, amount, description, status, reference)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(account.id, "loan_repayment", amount, `Repayment for Loan #${loan.id}`, "completed", ref);

    res.json({ message: "Loan repaid successfully." });
  });

  app.get("/api/customer/beneficiaries", authenticate, (req: any, res) => {
    const beneficiaries = db.prepare("SELECT * FROM beneficiaries WHERE user_id = ?").all(req.user.id);
    res.json(beneficiaries);
  });

  app.post("/api/customer/beneficiaries", authenticate, (req: any, res) => {
    const { name, account_number, bank_name } = req.body;
    db.prepare("INSERT INTO beneficiaries (user_id, name, account_number, bank_name) VALUES (?, ?, ?, ?)")
      .run(req.user.id, name, account_number, bank_name);
    res.json({ message: "Beneficiary added successfully." });
  });

  app.delete("/api/customer/beneficiaries/:id", authenticate, (req: any, res) => {
    db.prepare("DELETE FROM beneficiaries WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
    res.json({ message: "Beneficiary removed." });
  });

  app.get("/api/auth/profile", authenticate, (req: any, res) => {
    const user = db.prepare("SELECT id, first_name, last_name, email, username, phone, address, profile_picture, role, status, created_at FROM users WHERE id = ?").get(req.user.id);
    res.json(user);
  });

  app.put("/api/auth/profile", authenticate, upload.single("profile_picture"), (req: any, res) => {
    const { first_name, last_name, phone, address } = req.body;
    let query = "UPDATE users SET first_name = ?, last_name = ?, phone = ?, address = ?";
    let params = [first_name, last_name, phone, address];

    if (req.file) {
      query += ", profile_picture = ?";
      params.push(`/uploads/${req.file.filename}`);
    }

    query += " WHERE id = ?";
    params.push(req.user.id);

    db.prepare(query).run(...params);
    res.json({ message: "Profile updated successfully." });
  });

  app.put("/api/auth/security", authenticate, async (req: any, res) => {
    const { currentPassword, newPassword, pin } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);

    if (newPassword) {
      if (!(await bcrypt.compare(currentPassword, user.password))) {
        return res.status(400).json({ error: "Incorrect current password" });
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashed, req.user.id);
    }

    if (pin) {
      db.prepare("UPDATE users SET transfer_pin = ? WHERE id = ?").run(pin, req.user.id);
    }

    res.json({ message: "Security settings updated." });
  });

  // Admin Routes
  app.get("/api/admin/loans", authenticate, isAdmin, (req, res) => {
    const loans = db.prepare(`
      SELECT l.*, u.first_name, u.last_name 
      FROM loans l 
      JOIN users u ON l.user_id = u.id 
      ORDER BY l.created_at DESC
    `).all();
    res.json(loans);
  });

  app.post("/api/admin/loans/:id/status", authenticate, isAdmin, (req, res) => {
    const { status } = req.body;
    const loan: any = db.prepare("SELECT * FROM loans WHERE id = ?").get(req.params.id);
    if (!loan) return res.status(404).json({ error: "Loan not found" });

    db.prepare("UPDATE loans SET status = ? WHERE id = ?").run(status, req.params.id);

    if (status === 'approved') {
      const account: any = db.prepare("SELECT * FROM accounts WHERE user_id = ?").get(loan.user_id);
      db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(loan.amount, account.id);
      
      const ref = "LOAN" + Date.now();
      db.prepare(`
        INSERT INTO transactions (account_id, type, amount, description, status, reference)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(account.id, "loan_disbursement", loan.amount, `Disbursement for Loan #${loan.id}`, "completed", ref);
    }

    res.json({ message: `Loan ${status}` });
  });
  app.get("/api/admin/overview", authenticate, isAdmin, (req, res) => {
    const totalCustomers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").get() as any;
    const pendingApprovals = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'pending'").get() as any;
    const activeAccounts = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'").get() as any;
    const totalBalance = db.prepare("SELECT SUM(balance) as total FROM accounts").get() as any;
    const recentTransactions = db.prepare(`
      SELECT t.*, u.first_name, u.last_name 
      FROM transactions t 
      JOIN accounts a ON t.account_id = a.id 
      JOIN users u ON a.user_id = u.id 
      ORDER BY t.created_at DESC LIMIT 20
    `).all();

    res.json({
      stats: {
        totalCustomers: totalCustomers.count,
        pendingApprovals: pendingApprovals.count,
        activeAccounts: activeAccounts.count,
        totalBalance: totalBalance.total || 0
      },
      recentTransactions
    });
  });

  app.get("/api/admin/customers", authenticate, isAdmin, (req, res) => {
    const customers = db.prepare(`
      SELECT u.*, a.account_number, a.balance, a.card_number, a.card_expiry, a.card_cvv
      FROM users u 
      LEFT JOIN accounts a ON u.id = a.user_id 
      WHERE u.role = 'customer'
    `).all();
    res.json(customers);
  });

  app.post("/api/admin/customers/:id/status", authenticate, isAdmin, (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE users SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ message: `Customer status updated to ${status}` });
  });

  app.put("/api/admin/customers/:id", authenticate, isAdmin, (req, res) => {
    const { 
      first_name, last_name, email, phone, address, status, 
      account_number, balance, transfer_pin,
      card_number, card_expiry, card_cvv
    } = req.body;
    
    db.transaction(() => {
      db.prepare(`
        UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ?, status = ?, transfer_pin = ?
        WHERE id = ?
      `).run(first_name, last_name, email, phone, address, status, transfer_pin, req.params.id);

      db.prepare(`
        UPDATE accounts SET account_number = ?, balance = ?, card_number = ?, card_expiry = ?, card_cvv = ?
        WHERE user_id = ?
      `).run(account_number, balance, card_number, card_expiry, card_cvv, req.params.id);
    })();

    res.json({ message: "Customer details updated." });
  });

  app.delete("/api/admin/customers/:id", authenticate, isAdmin, (req, res) => {
    db.prepare("DELETE FROM accounts WHERE user_id = ?").run(req.params.id);
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ message: "Customer account deleted." });
  });

  app.post("/api/admin/customers/:id/reset-security", authenticate, isAdmin, async (req, res) => {
    const { password, pin } = req.body;
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashed, req.params.id);
    }
    if (pin) {
      db.prepare("UPDATE users SET transfer_pin = ? WHERE id = ?").run(pin, req.params.id);
    }
    res.json({ message: "Security credentials updated." });
  });

  app.get("/api/admin/settings", authenticate, isAdmin, (req, res) => {
    const settings = db.prepare("SELECT * FROM system_settings").all();
    const settingsObj = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  });

  app.post("/api/admin/settings", authenticate, isAdmin, (req, res) => {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)").run(key, value);
    }
    res.json({ message: "Settings updated." });
  });

  app.post("/api/admin/transactions/:id/approve", authenticate, isAdmin, (req, res) => {
    const txn: any = db.prepare("SELECT * FROM transactions WHERE id = ?").get(req.params.id);
    if (!txn || txn.status !== "pending") return res.status(400).json({ error: "Invalid transaction" });

    const account: any = db.prepare("SELECT * FROM accounts WHERE id = ?").get(txn.account_id);
    
    if (txn.type === "transfer_out") {
      if (account.balance < txn.amount) return res.status(400).json({ error: "Insufficient balance in account" });
      db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(txn.amount, txn.account_id);
    } else if (txn.type === "deposit" || txn.type === "loan_disbursement") {
      db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(txn.amount, txn.account_id);
    }

    db.prepare("UPDATE transactions SET status = 'completed' WHERE id = ?").run(req.params.id);
    res.json({ message: "Transaction approved and processed." });
  });

  app.put("/api/admin/transactions/:id/date", authenticate, isAdmin, (req, res) => {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: "Date is required" });
    
    try {
      // Ensure the date is valid and convert to ISO string if needed
      const newDate = new Date(date).toISOString();
      db.prepare("UPDATE transactions SET created_at = ? WHERE id = ?").run(newDate, req.params.id);
      res.json({ message: "Transaction date updated successfully." });
    } catch (error: any) {
      res.status(400).json({ error: "Invalid date format" });
    }
  });

  app.post("/api/admin/credit-debit", authenticate, isAdmin, (req, res) => {
    const { userId, amount, type, description } = req.body;
    const account: any = db.prepare("SELECT * FROM accounts WHERE user_id = ?").get(userId);
    if (!account) return res.status(404).json({ error: "Account not found" });

    const ref = "ADJ" + Date.now();
    db.prepare(`
      INSERT INTO transactions (account_id, type, amount, description, status, reference)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(account.id, type, amount, description, "completed", ref);

    if (type === "credit") {
      db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(amount, account.id);
    } else {
      db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(amount, account.id);
    }

    res.json({ message: `Account ${type}ed successfully.` });
  });

  app.post("/api/admin/factory-reset", authenticate, isAdmin, (req, res) => {
    db.prepare("DELETE FROM transactions").run();
    db.prepare("DELETE FROM loans").run();
    db.prepare("DELETE FROM chat_messages").run();
    db.prepare("DELETE FROM chat_sessions").run();
    db.prepare("UPDATE accounts SET balance = 0").run();
    res.json({ message: "System reset successful." });
  });

  app.post("/api/contact", (req, res) => {
    const { name, email, message } = req.body;
    db.prepare("INSERT INTO support_messages (name, email, message) VALUES (?, ?, ?)").run(name, email, message);
    res.json({ message: "Message sent successfully." });
  });

  // Chat History
  app.get("/api/customer/transactions/:id/receipt", authenticate, async (req: any, res) => {
    const txn: any = db.prepare(`
      SELECT t.*, u.first_name, u.last_name, a.account_number 
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE t.id = ? AND u.id = ?
    `).get(req.params.id, req.user.id);

    if (!txn) return res.status(404).json({ error: "Transaction not found" });

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("MOONSTONE BANK", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text("Official Transaction Receipt", 105, 30, { align: "center" });
    
    doc.line(20, 35, 190, 35);

    doc.setFontSize(12);
    doc.text(`Reference: ${txn.reference}`, 20, 50);
    doc.text(`Date: ${new Date(txn.created_at).toLocaleString()}`, 20, 60);
    doc.text(`Customer: ${txn.first_name} ${txn.last_name}`, 20, 70);
    doc.text(`Account: ${txn.account_number}`, 20, 80);
    doc.text(`Description: ${txn.description}`, 20, 90);
    doc.text(`Type: ${txn.type.toUpperCase()}`, 20, 100);
    
    doc.setFontSize(16);
    doc.text(`Amount: ${txn.amount.toFixed(2)} USD`, 20, 120);
    doc.text(`Status: ${txn.status.toUpperCase()}`, 20, 130);

    doc.setFontSize(8);
    doc.text("Thank you for banking with Moonstone.", 105, 150, { align: "center" });

    const pdfOutput = doc.output("arraybuffer");
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdfOutput));
  });

  app.get("/api/admin/chat/sessions", authenticate, isAdmin, (req: any, res) => {
    const sessions = db.prepare(`
      SELECT cs.*, u.first_name, u.last_name, u.profile_picture,
      (SELECT message_text FROM chat_messages WHERE session_id = cs.id ORDER BY timestamp DESC LIMIT 1) as last_message,
      (SELECT COUNT(*) FROM chat_messages WHERE session_id = cs.id AND read_status = 0 AND sender_id != ?) as unread_count
      FROM chat_sessions cs
      JOIN users u ON cs.customer_id = u.id
      ORDER BY (SELECT timestamp FROM chat_messages WHERE session_id = cs.id ORDER BY timestamp DESC LIMIT 1) DESC
    `).all(req.user.id);
    res.json(sessions);
  });

  app.post("/api/chat/upload", authenticate, upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  app.post("/api/chat/messages/:id/read", authenticate, (req: any, res) => {
    db.prepare("UPDATE chat_messages SET read_status = 1 WHERE session_id = ? AND sender_id != ?").run(req.params.id, req.user.id);
    res.json({ message: "Messages marked as read" });
  });

  app.get("/api/chat/session", authenticate, (req: any, res) => {
    let session: any = db.prepare("SELECT * FROM chat_sessions WHERE customer_id = ? AND status = 'active'").get(req.user.id);
    if (!session) {
      const result = db.prepare("INSERT INTO chat_sessions (customer_id) VALUES (?)").run(req.user.id);
      session = { id: result.lastInsertRowid, customer_id: req.user.id, status: 'active' };
    }
    res.json(session);
  });

  app.get("/api/chat/history/:sessionId", authenticate, (req: any, res) => {
    const messages = db.prepare(`
      SELECT m.*, u.first_name, u.last_name 
      FROM chat_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.session_id = ?
      ORDER BY m.timestamp ASC
    `).all(req.params.sessionId);
    res.json(messages);
  });

  // --- WEBSOCKET CHAT ---
  const clients = new Map<number, Set<WebSocket>>();

  wss.on("connection", (ws, req) => {
    let userId: number | null = null;

    ws.on("message", (data) => {
      const message = JSON.parse(data.toString());
      
      if (message.type === "auth") {
        try {
          const decoded: any = jwt.verify(message.token, JWT_SECRET);
          userId = decoded.id;
          if (!clients.has(userId!)) clients.set(userId!, new Set());
          clients.get(userId!)?.add(ws);
        } catch {}
      }

      if (message.type === "chat") {
        const { sessionId, text, receiverId } = message;
        db.prepare("INSERT INTO chat_messages (session_id, sender_id, message_text) VALUES (?, ?, ?)")
          .run(sessionId, userId, text);
        
        if (receiverId) {
          // Direct message
          const receiverSockets = clients.get(receiverId);
          if (receiverSockets) {
            receiverSockets.forEach(s => {
              if (s.readyState === WebSocket.OPEN) {
                s.send(JSON.stringify({ type: "chat", senderId: userId, text, sessionId }));
              }
            });
          }
        } else {
          // Customer sending to admins
          const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all() as any[];
          admins.forEach(admin => {
            const adminSockets = clients.get(admin.id);
            if (adminSockets) {
              adminSockets.forEach(s => {
                if (s.readyState === WebSocket.OPEN) {
                  s.send(JSON.stringify({ type: "chat", senderId: userId, text, sessionId }));
                }
              });
            }
          });
        }
        
        // Sync sender's other devices
        const senderSockets = clients.get(userId!);
        if (senderSockets) {
          senderSockets.forEach(s => {
            if (s !== ws && s.readyState === WebSocket.OPEN) {
              s.send(JSON.stringify({ type: "chat", senderId: userId, text, sessionId }));
            }
          });
        }
      }
    });

    ws.on("close", () => {
      if (userId) {
        clients.get(userId)?.delete(ws);
        if (clients.get(userId)?.size === 0) clients.delete(userId);
      }
    });
  });

  app.post("/api/admin/send-message", authenticate, isAdmin, (req: any, res) => {
    const { userId, message } = req.body;
    
    // 1. Find or create an active chat session for the user
    let session: any = db.prepare("SELECT * FROM chat_sessions WHERE customer_id = ? AND status = 'active'").get(userId);
    if (!session) {
      const result = db.prepare("INSERT INTO chat_sessions (customer_id) VALUES (?)").run(userId);
      session = { id: result.lastInsertRowid, customer_id: userId, status: 'active' };
    }

    // 2. Insert the message
    db.prepare("INSERT INTO chat_messages (session_id, sender_id, message_text) VALUES (?, ?, ?)")
      .run(session.id, req.user.id, message);

    // 3. Notify the user via WebSocket if online
    const userSockets = clients.get(userId);
    if (userSockets) {
      userSockets.forEach(s => {
        if (s.readyState === WebSocket.OPEN) {
          s.send(JSON.stringify({ type: "chat", senderId: req.user.id, text: message, sessionId: session.id }));
        }
      });
    }

    res.json({ message: "Message sent successfully." });
  });

  // API 404 Fallback
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Initializing Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      configFile: path.resolve(process.cwd(), "vite.config.ts"),
    });
    app.use(vite.middlewares);
    console.log("Vite middleware initialized.");
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist/index.html"));
    });
  }

  const PORT = 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Moonstone Bank Server is listening on port ${PORT}`);
  });
}

console.log("Starting Moonstone Bank Server...");

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
