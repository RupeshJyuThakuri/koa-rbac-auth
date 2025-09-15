import { EntitySchema } from "typeorm";

export const Role = new EntitySchema({
  name: "Role",
  tableName: "role",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true, // SERIAL
    },
    name: {
      type: "varchar",
      unique: true,
    },
  },
  relations: {
    users: {
      type: "one-to-many",
      target: "User",
      inverseSide: "role",
    },
  },
});
