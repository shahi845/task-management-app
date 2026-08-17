"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseAuth = void 0;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = (_a = process.env.FIREBASE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, '\n');
if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
}
const firebaseApp = (0, app_1.getApps)().length === 0
    ? (0, app_1.initializeApp)({
        credential: (0, app_1.cert)({
            projectId,
            clientEmail,
            privateKey,
        }),
    })
    : (0, app_1.getApps)()[0];
exports.firebaseAuth = (0, auth_1.getAuth)(firebaseApp);
