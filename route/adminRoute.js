import e from "express";
import { adminLoginAsUser, getAllUsers, updateTransferPermission } from "../controller/adminController.js";
import { adminGetTickets } from "../controller/adminSupportController.js";
import { getAllCheckDeposits } from "../controller/admincheckController/AdminCheckController.js";
import { approveCheckDeposit } from "../controller/admincheckController/approveCheckController.js";
import { rejectCheckDeposit } from "../controller/admincheckController/rejectCheckController.js";
import { deleteCheckDeposit } from "../controller/admincheckController/deleteCheckController.js";
import { updateUserTransferPermission } from "../controller/adminUsersController/updateUserTransferPermission.js";
import { adminGetUserById, adminUpdateUserById } from "../controller/adminUsersController/adminUsersController.js";
import { adminGetUserTransactions, adminUpdateTransaction } from "../controller/admin/adminTransactionsController.js";
import { adminCreditUser, adminDebitUser } from "../controller/admin/adminAddTransactionController.js";
import { sendAdminEmailToUser } from "../controller/admin/sendEmailController.js";
import { deleteAdminUser } from "../controller/admin/deleteUserController.js";


const AdminRouter = e.Router();

AdminRouter.get("/users", getAllUsers);
AdminRouter.patch("/users/:id/transfer", updateTransferPermission);

AdminRouter.post("/users/:id/login", adminLoginAsUser);

AdminRouter.get("/user-messages", adminGetTickets);


// Admin routes for check deposits
AdminRouter.get("/check-deposits", getAllCheckDeposits);

AdminRouter.patch("/check-deposits/:id/approve", approveCheckDeposit);
AdminRouter.patch("/check-deposits/:id/reject", rejectCheckDeposit);
AdminRouter.delete("/check-deposits/:id", deleteCheckDeposit);

// Other admin routes can be added here
AdminRouter.patch("/users/:userId/transfer", updateUserTransferPermission);

AdminRouter.get("/users/:id", adminGetUserById);
AdminRouter.patch("/users/:id", adminUpdateUserById);

AdminRouter.get("/user/transactions", adminGetUserTransactions);
AdminRouter.patch("/transactions/:txId", adminUpdateTransaction);

// GET single user
// AdminRouter.get("/users/:id", adminAuth, getAdminUserById);
// CREDIT
AdminRouter.post("/transfer/credit", adminCreditUser);
// DEBIT
AdminRouter.post("/transfer/debit", adminDebitUser);

AdminRouter.post("/messages/email/:id", sendAdminEmailToUser);

AdminRouter.delete("/users/:id", deleteAdminUser);



export default AdminRouter;