import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/contact", async (req, res): Promise<void> => {
  const { name, email, message, phone } = req.body as {
    name?: string; email?: string; message?: string; phone?: string;
  };

  if (!name || !email || !message) {
    res.status(400).json({ error: "Name, email, and message are required" });
    return;
  }

  // In production, you'd send an email here. For now we log and respond.
  req.log.info({ name, email, phone: phone || "" }, "Contact form submission");
  res.json({ success: true, message: "Your message has been received. We will contact you soon." });
});

export default router;
