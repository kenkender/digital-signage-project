let controlState = {
  version: Date.now(),
  command: { type: "none", payload: {} },
};

// ส่งคำสั่งไปยัง player
exports.issueControl = (req, res) => {
  const { type, payload } = req.body || {};
  if (!type) {
    return res.status(400).json({ message: "Missing control type" });
  }

  controlState = {
    version: Date.now(),
    command: {
      type,
      payload: payload || {},
    },
  };

  res.json(controlState);
};

// ดึงสถานะคำสั่งล่าสุดให้ player poll
exports.getControlState = (_req, res) => {
  res.json(controlState);
};

// ล้างคำสั่ง (ตั้งค่าเป็น none)
exports.clearControl = (_req, res) => {
  controlState = {
    version: Date.now(),
    command: { type: "none", payload: {} },
  };
  res.json(controlState);
};
