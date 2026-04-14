import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, OneToMany } from 'typeorm';
import { Groups } from 'src/groups/groups.entity';
import { Chat } from 'src/chat/chat.entity';
import { Subscription } from 'src/subscription/subscription.entity';

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column()
  password!: string;

  @Column()
  mail!: string;

  @Column({default: 'user'})
  role!: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  CreationDate!: Date;

  //Cela servira pour le système de streak
  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  LastConnectionDate!: Date; 

  @ManyToMany(() => Groups, (group) => group.users)
  groups!: Groups[];

  @OneToMany(() => Chat, (chat) => chat.user)
  chats!: Chat[];
  
  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscription!: Subscription[];
}
