import { EntitySchema } from "typeorm";

export const Profile = new EntitySchema({
  name: "Profile",
  tableName: "profiles",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    profilePicture: {
      type: "varchar",
      nullable: true, // optional
    },
    bio: {
      type: "text",
      nullable: true,
    },
    phoneNumber: {
      type: "varchar",
      nullable: true,
    },
    address: {
      type: "varchar",
      nullable: true,
    },
    dateOfBirth: {
      type: "date",
      nullable: true,
    },
  },
  relations: {
    user: {
      type: "one-to-one",
      target: "User",
      joinColumn: { name: "userId" }, // foreign key in Profile table
      onDelete: "CASCADE",
    },
  },
});
