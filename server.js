
import "dotenv/config";
import express from "express";
import cors from "cors";
import prisma from "./db.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Marut Gym Software API",
    status: "running",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "healthy",
      application: "Marut Gym Software",
      database: "connected",
    });
  } catch (error) {
    console.error("Health check failed:", error.message);
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
    });
  }
});

app.get("/api/members", async (req, res) => {
  try {
    const members = await prisma.member.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(members);
  } catch (error) {
    console.error("List members failed:", error.message);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

app.post("/api/members", async (req, res) => {
  try {
    const { fullName, email, phone } = req.body;

    if (
      typeof fullName !== "string" ||
      !fullName.trim() ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        error: "Full name and email are required",
      });
    }

    const member = await prisma.member.create({
      data: {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone:
          typeof phone === "string" && phone.trim()
            ? phone.trim()
            : null,
      },
    });

    res.status(201).json(member);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "A member with this email already exists",
      });
    }

    console.error("Create member failed:", error.message);
    res.status(500).json({ error: "Failed to create member" });
  }
});

app.put("/api/members/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid member ID" });
  }

  try {
    const { fullName, email, phone } = req.body;
    const data = {};

    if (fullName !== undefined) {
      if (typeof fullName !== "string" || !fullName.trim()) {
        return res.status(400).json({ error: "Invalid full name" });
      }
      data.fullName = fullName.trim();
    }

    if (email !== undefined) {
      if (typeof email !== "string" || !email.trim()) {
        return res.status(400).json({ error: "Invalid email" });
      }
      data.email = email.trim().toLowerCase();
    }

    if (phone !== undefined) {
      if (phone !== null && typeof phone !== "string") {
        return res.status(400).json({ error: "Invalid phone" });
      }
      data.phone =
        typeof phone === "string" && phone.trim()
          ? phone.trim()
          : null;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        error: "Provide at least one field to update",
      });
    }

    const member = await prisma.member.update({
      where: { id },
      data,
    });

    res.json(member);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Member not found" });
    }
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Email already exists" });
    }

    console.error("Update member failed:", error.message);
    res.status(500).json({ error: "Failed to update member" });
  }
});

app.delete("/api/members/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid member ID" });
  }

  try {
    await prisma.member.delete({ where: { id } });
    res.json({ message: "Member deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Member not found" });
    }

    console.error("Delete member failed:", error.message);
    res.status(500).json({ error: "Failed to delete member" });
  }
});

app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Marut Gym backend running on port ${PORT}`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

