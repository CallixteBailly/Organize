import { relations } from "drizzle-orm";
import { garages } from "./garages";
import { users } from "./users";
import { customers } from "./customers";
import { vehicles } from "./vehicles";
import { stockCategories } from "./stock-categories";
import { stockItems } from "./stock-items";
import { stockMovements } from "./stock-movements";
import { suppliers } from "./suppliers";
import { supplierCatalog } from "./supplier-catalog";
import { orders } from "./orders";
import { orderItems } from "./order-items";
import { repairOrders } from "./repair-orders";
import { repairOrderLines } from "./repair-order-lines";
import { quotes } from "./quotes";
import { quoteLines } from "./quote-lines";
import { invoices } from "./invoices";
import { invoiceLines } from "./invoice-lines";
import { payments } from "./payments";
import { notifications } from "./notifications";

// Garages
export const garagesRelations = relations(garages, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  stockItems: many(stockItems),
  stockCategories: many(stockCategories),
  suppliers: many(suppliers),
  orders: many(orders),
  repairOrders: many(repairOrders),
  quotes: many(quotes),
  invoices: many(invoices),
  payments: many(payments),
  notifications: many(notifications),
}));

// Users
export const usersRelations = relations(users, ({ one }) => ({
  garage: one(garages, { fields: [users.garageId], references: [garages.id] }),
}));

// Customers
export const customersRelations = relations(customers, ({ one, many }) => ({
  garage: one(garages, { fields: [customers.garageId], references: [garages.id] }),
  vehicles: many(vehicles),
  repairOrders: many(repairOrders),
  invoices: many(invoices),
  quotes: many(quotes),
}));

// Vehicles
export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  garage: one(garages, { fields: [vehicles.garageId], references: [garages.id] }),
  customer: one(customers, { fields: [vehicles.customerId], references: [customers.id] }),
  repairOrders: many(repairOrders),
}));

// Stock Categories
export const stockCategoriesRelations = relations(stockCategories, ({ one, many }) => ({
  garage: one(garages, { fields: [stockCategories.garageId], references: [garages.id] }),
  items: many(stockItems),
}));

// Stock Items
export const stockItemsRelations = relations(stockItems, ({ one, many }) => ({
  garage: one(garages, { fields: [stockItems.garageId], references: [garages.id] }),
  category: one(stockCategories, {
    fields: [stockItems.categoryId],
    references: [stockCategories.id],
  }),
  movements: many(stockMovements),
  supplierCatalogEntries: many(supplierCatalog),
}));

// Stock Movements
export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  garage: one(garages, { fields: [stockMovements.garageId], references: [garages.id] }),
  stockItem: one(stockItems, {
    fields: [stockMovements.stockItemId],
    references: [stockItems.id],
  }),
  performer: one(users, { fields: [stockMovements.performedBy], references: [users.id] }),
}));

// Suppliers
export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  garage: one(garages, { fields: [suppliers.garageId], references: [garages.id] }),
  catalogEntries: many(supplierCatalog),
  orders: many(orders),
}));

// Supplier Catalog
export const supplierCatalogRelations = relations(supplierCatalog, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierCatalog.supplierId],
    references: [suppliers.id],
  }),
  stockItem: one(stockItems, {
    fields: [supplierCatalog.stockItemId],
    references: [stockItems.id],
  }),
}));

// Orders
export const ordersRelations = relations(orders, ({ one, many }) => ({
  garage: one(garages, { fields: [orders.garageId], references: [garages.id] }),
  supplier: one(suppliers, { fields: [orders.supplierId], references: [suppliers.id] }),
  orderedByUser: one(users, { fields: [orders.orderedBy], references: [users.id] }),
  items: many(orderItems),
}));

// Order Items
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  stockItem: one(stockItems, { fields: [orderItems.stockItemId], references: [stockItems.id] }),
  catalogEntry: one(supplierCatalog, {
    fields: [orderItems.catalogEntryId],
    references: [supplierCatalog.id],
  }),
}));

// Repair Orders
export const repairOrdersRelations = relations(repairOrders, ({ one, many }) => ({
  garage: one(garages, { fields: [repairOrders.garageId], references: [garages.id] }),
  customer: one(customers, { fields: [repairOrders.customerId], references: [customers.id] }),
  vehicle: one(vehicles, { fields: [repairOrders.vehicleId], references: [vehicles.id] }),
  assignee: one(users, { fields: [repairOrders.assignedTo], references: [users.id] }),
  creator: one(users, { fields: [repairOrders.createdBy], references: [users.id] }),
  lines: many(repairOrderLines),
}));

// Repair Order Lines
export const repairOrderLinesRelations = relations(repairOrderLines, ({ one }) => ({
  repairOrder: one(repairOrders, {
    fields: [repairOrderLines.repairOrderId],
    references: [repairOrders.id],
  }),
  stockItem: one(stockItems, {
    fields: [repairOrderLines.stockItemId],
    references: [stockItems.id],
  }),
}));

// Quotes
export const quotesRelations = relations(quotes, ({ one, many }) => ({
  garage: one(garages, { fields: [quotes.garageId], references: [garages.id] }),
  customer: one(customers, { fields: [quotes.customerId], references: [customers.id] }),
  vehicle: one(vehicles, { fields: [quotes.vehicleId], references: [vehicles.id] }),
  creator: one(users, { fields: [quotes.createdBy], references: [users.id] }),
  lines: many(quoteLines),
}));

// Quote Lines
export const quoteLinesRelations = relations(quoteLines, ({ one }) => ({
  quote: one(quotes, { fields: [quoteLines.quoteId], references: [quotes.id] }),
  stockItem: one(stockItems, { fields: [quoteLines.stockItemId], references: [stockItems.id] }),
}));

// Invoices
export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  garage: one(garages, { fields: [invoices.garageId], references: [garages.id] }),
  customer: one(customers, { fields: [invoices.customerId], references: [customers.id] }),
  repairOrder: one(repairOrders, {
    fields: [invoices.repairOrderId],
    references: [repairOrders.id],
  }),
  creator: one(users, { fields: [invoices.createdBy], references: [users.id] }),
  lines: many(invoiceLines),
  payments: many(payments),
}));

// Invoice Lines
export const invoiceLinesRelations = relations(invoiceLines, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceLines.invoiceId], references: [invoices.id] }),
  stockItem: one(stockItems, {
    fields: [invoiceLines.stockItemId],
    references: [stockItems.id],
  }),
}));

// Payments
export const paymentsRelations = relations(payments, ({ one }) => ({
  garage: one(garages, { fields: [payments.garageId], references: [garages.id] }),
  invoice: one(invoices, { fields: [payments.invoiceId], references: [invoices.id] }),
}));

// Notifications
export const notificationsRelations = relations(notifications, ({ one }) => ({
  garage: one(garages, { fields: [notifications.garageId], references: [garages.id] }),
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
