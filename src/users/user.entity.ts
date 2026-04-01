import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { Group } from 'src/groups/groups.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  userId: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column()
  mail: string;

  @Column({default: 'user'})
  role: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  CreationDate: Date;

  //Cela servira pour le système de streak
  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  LastConnectionDate: Date; 

  @ManyToMany(() => Group, (group) => group.users)
  groups: Group[];
}
