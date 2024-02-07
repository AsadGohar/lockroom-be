import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  family_name: string;

  @Column({ nullable: true })
  given_name: string;

  @Column({ nullable: true })
  full_name: string;

  @Column({ nullable: true })
  nickname: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: false })
  is_email_verified: boolean;

  @Column({ default: false })
  is_session_active: boolean;

  @Column({ default: 'admin' })
  role: string;

  @Column({ default: false })
  sso_login: boolean;

  @Column({ default: false })
  sso_type: boolean;

  @Column({ default: '' })
  display_picture_url: string;

  @BeforeInsert()
  addId() {
    this.id = uuidv4();
  }
}
