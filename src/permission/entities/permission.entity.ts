import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { FilesPermissions } from 'src/files-permissions/entities/files-permissions.entity';
import { v4 as uuidv4 } from 'uuid';
@Entity()
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  type: string;

  @Column({ nullable: true})
  status: boolean

  @OneToMany(() => FilesPermissions, fp => fp.permission)
  FilesPermissions: FilesPermissions[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @BeforeInsert()
  addId() {
    this.id = uuidv4();
  }
}
