// src/entities/Otp.ts
import { EntitySchema } from "typeorm";

export const Otp = new EntitySchema({
  name: "Otp",
  tableName: "otps",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    email: {
      type: "varchar",
    },
    code: {
      type: "varchar",
    },
    expiresAt: {
      type: "timestamp",
    },
    used: {
      type: "boolean",
      default: false,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
  },
});
