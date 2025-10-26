export default function requireFields(...fields) {
    return (req, res, next) => {
        if (!req.body) {
            return res.status(400).json({ error: "Missing request body" });
        }

        for (const field of fields) {
            const value = req.body[field];

            if (
                value === undefined ||
                value === null ||
                (typeof value === "string" && value.trim() === "")
            ) {
                return res.status(400).json({ error: `Missing or empty field: ${field}` });
            }
        }

        next();
    };
}
