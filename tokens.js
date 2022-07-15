const tokens = {};
const crypto = require("crypto");

function randomString() {
  let b = Buffer.alloc(15);
  crypto.randomFillSync(b);
  return b.toString("hex");
}

function newToken(u) {
  let s = randomString();
  tokens[s] = u;
  return s;
}

function getAssociatedUser(t) {
  return tokens[t];
}

module.exports = { newToken, getAssociatedUser };
