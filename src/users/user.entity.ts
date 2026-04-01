import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { Groups } from 'src/groups/groups.entity';

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

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

  @ManyToMany(() => Groups, (group) => group.users)
  groups: Groups[];
}
