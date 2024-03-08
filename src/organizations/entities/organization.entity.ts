import {
Entity,
PrimaryGeneratedColumn,
Column,
OneToMany,
OneToOne,
CreateDateColumn,
UpdateDateColumn,
BeforeInsert,
JoinColumn,
ManyToMany,
JoinTable
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Group } from 'src/groups/entities/group.entity';
import { Invite } from 'src/invites/entities/invite.entity';
import { v4 as uuidv4 } from 'uuid';
import { File } from 'src/files/entities/file.entity';
import { Folder } from 'src/folders/entities/folder.entity';

@Entity()
export class Organization {
@PrimaryGeneratedColumn('uuid')
id: string;

@Column({ nullable: true })
name: string;

@OneToOne(() => User, (user) => user.organization_created)
@JoinColumn()
creator: User;

@ManyToMany(() => User, user => user.organizations_added_in)
@JoinTable()
users: User[];

@OneToMany(() => Group, (group) => group.organization, { nullable: true , cascade:true})
groups: Group[];

@OneToMany(() => Invite, (invite) => invite.organization, { nullable: true, cascade:true })
invites: Invite[];

@OneToMany(() => File, (file) => file.organization)
files: File[];

@OneToMany(() => Folder, (folder) => folder.organization)
folder: Folder[];

@CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
createdAt: Date;

@UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
updatedAt: Date;

@BeforeInsert()
addId() {
  this.id = uuidv4();
}
}
