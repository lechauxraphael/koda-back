import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Group {
  @PrimaryGeneratedColumn()
  groupId: number;

  @Column({ unique: false })
  name: string;

  @Column()
  creator: string;

  @Column({ default: 4 })
  maxGroupSize: number;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  dateCreation: Date;

  @ManyToMany(() => User, (user) => user.groups)
  @JoinTable({
    name: 'groups_users',
    joinColumn: { name: 'id_groups', referencedColumnName: 'groupId' }, 
    inverseJoinColumn: { name: 'id_users', referencedColumnName: 'userId' } 
  })
  users: User[];
 }
