import crypto from "crypto";

// ── In-memory guest token store ──────────────────────
// Map<token, { roomId, createdBy, expiresAt, used }>
const guestTokens = new Map();

// Token expiry time: 30 minutes
const TOKEN_EXPIRY_MS = 30 * 60 * 1000;

// Cleanup expired tokens every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [token, data] of guestTokens.entries()) {
        if (now > data.expiresAt) {
            guestTokens.delete(token);
        }
    }
}, 5 * 60 * 1000);

/**
 * POST /api/v1/guest/generate
 * Body: { roomId }
 * Header: Authorization or body.token (user auth token)
 * 
 * Generate a unique, single-use guest invite token for a specific room.
 */
const generateGuestToken = async (req, res) => {
    try {
        const { roomId, token: userToken } = req.body;

        if (!roomId) {
            return res.status(400).json({ message: "roomId is required" });
        }

        if (!userToken) {
            return res.status(401).json({ message: "Authentication required to generate guest link" });
        }

        // Generate a unique token
        const guestToken = crypto.randomBytes(32).toString("hex");

        // Store with metadata
        guestTokens.set(guestToken, {
            roomId: roomId,
            createdBy: userToken,
            expiresAt: Date.now() + TOKEN_EXPIRY_MS,
            used: false,
        });

        console.log(`[Guest Token] Generated for room: ${roomId}, token: ${guestToken.slice(0, 8)}...`);

        return res.status(201).json({
            guestToken: guestToken,
            expiresIn: TOKEN_EXPIRY_MS / 1000, // seconds
            roomId: roomId,
        });
    } catch (e) {
        console.error("[Guest Token] Generate error:", e);
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

/**
 * POST /api/v1/guest/validate
 * Body: { guestToken, roomId }
 * 
 * Validate a guest token. If valid, marks it as used (single-use).
 */
const validateGuestToken = async (req, res) => {
    try {
        const { guestToken, roomId } = req.body;

        if (!guestToken || !roomId) {
            return res.status(400).json({
                valid: false,
                message: "guestToken and roomId are required",
            });
        }

        const tokenData = guestTokens.get(guestToken);

        // Token doesn't exist
        if (!tokenData) {
            console.log(`[Guest Token] Invalid/unknown token: ${guestToken.slice(0, 8)}...`);
            return res.status(401).json({
                valid: false,
                message: "Invalid or expired guest link. Please request a new invite.",
            });
        }

        // Token already used
        if (tokenData.used) {
            console.log(`[Guest Token] Already used token: ${guestToken.slice(0, 8)}...`);
            guestTokens.delete(guestToken); // Clean up
            return res.status(401).json({
                valid: false,
                message: "This invite link has already been used. Please request a new one.",
            });
        }

        // Token expired
        if (Date.now() > tokenData.expiresAt) {
            console.log(`[Guest Token] Expired token: ${guestToken.slice(0, 8)}...`);
            guestTokens.delete(guestToken); // Clean up
            return res.status(401).json({
                valid: false,
                message: "This invite link has expired. Please request a new one.",
            });
        }

        // Room mismatch — someone trying to use token for a different room
        if (tokenData.roomId !== roomId) {
            console.log(`[Guest Token] Room mismatch: expected ${tokenData.roomId}, got ${roomId}`);
            return res.status(401).json({
                valid: false,
                message: "Unauthorized — this link is not valid for this meeting.",
            });
        }

        // ✅ Token is valid — mark as used (single-use)
        tokenData.used = true;
        guestTokens.set(guestToken, tokenData);

        console.log(`[Guest Token] Validated & consumed for room: ${roomId}`);

        return res.status(200).json({
            valid: true,
            message: "Guest access granted",
            roomId: roomId,
        });
    } catch (e) {
        console.error("[Guest Token] Validate error:", e);
        return res.status(500).json({
            valid: false,
            message: `Something went wrong: ${e.message}`,
        });
    }
};

export { generateGuestToken, validateGuestToken, guestTokens };
