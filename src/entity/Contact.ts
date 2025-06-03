import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";

export type LinkPrecedence = "primary" | "secondary";

/**
 * Contact entity representing a customer's contact information.
 * Can be either a primary contact or a secondary contact linked to a primary.
 */
@Entity("contact")
export class Contact {
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * Customer's phone number.
   * Can be null if only email is provided.
   */
  @Column({ name: "phone_number", type: "varchar", nullable: true })
  phoneNumber!: string | null;

  /**
   * Customer's email address.
   * Can be null if only phone number is provided.
   */
  @Column({ type: "varchar", nullable: true })
  email!: string | null;

  /**
   * ID of the primary contact this contact is linked to.
   * Null for primary contacts.
   */
  @Column({ name: "linked_id", type: "int", nullable: true })
  linkedId!: number | null;

  /**
   * Indicates whether this is a primary contact or a secondary contact.
   * Secondary contacts are always linked to a primary contact.
   */
  @Column({
    name: "link_precedence",
    type: "enum",
    enum: ["primary", "secondary"],
    default: "primary",
    enumName: "link_precedence_enum"
  })
  linkPrecedence!: LinkPrecedence;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt!: Date | null;
} 