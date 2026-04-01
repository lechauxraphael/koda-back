import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';
import { Users } from '../users/user.entity';

@Entity()
export class Groups {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: false })
  name: string;

  @Column()
  creator: string;

  @Column({ default: 4 })
  maxGroupSize: number;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  dateCreation: Date;

  @ManyToMany(() => Users, (user) => user.groups)
  @JoinTable({
    name: 'groups_users',
    joinColumn: { name: 'id_groups', referencedColumnName: 'id' }, 
    inverseJoinColumn: { name: 'id_users', referencedColumnName: 'id' } 
  })
  users: Users[];
 }
