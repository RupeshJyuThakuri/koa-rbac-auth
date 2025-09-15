import { EntitySchema } from "typeorm";

export const User = new EntitySchema({
  name: "User",
  tableName: "user",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid", // UUID PK
    },
    name: {
      type: "varchar",
    },
    email: {
      type: "varchar",
      unique: true,
    },
    password: {
      type: "varchar",
    },
  },
  relations: {
    role: {
      type: "many-to-one",
      target: "Role",
      joinColumn: { name: "roleId" },
    },
  },
});
