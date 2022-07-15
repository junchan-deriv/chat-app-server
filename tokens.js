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

function nukeUser(u) {
  Object.keys(tokens).forEach((t) => {
    if (tokens[t] === u) {
      tokens[t] = undefined;
    }
  });
}

function logoutUser(t) {
  tokens[t] = undefined;
}

module.exports = { newToken, getAssociatedUser, nukeUser, logoutUser };
