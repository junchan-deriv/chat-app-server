const admin = require("firebase-admin");
var serviceAccount = require("./sdk_secret.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_URL,
});

const firebase = admin.firestore();
const ref = firebase.collection("/messages");

module.exports = {};
module.exports.addMessage = function (msg) {
  ref.doc().set(msg);
};
module.exports.getLastMessages = function (from, to, cb) {
  let query = ref.orderBy("time", "asc");
  if (from) {
    query = query.startAfter(from - 1);
  }
  if (to) {
    query = query.endBefore(to + 1);
  }
  query.get().then((v) => {
    const data = [];
    v.forEach((g) => data.push(g.data()));
    cb(data);
  });
};
