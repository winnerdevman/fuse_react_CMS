import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { OrganizationEntity, UserEntity } from '../organization'
import { ChatEntity, MentionEntity } from '.'

export enum TC_MESSAGE_TYPE {
  TEXT = 'text',
  IMAGE = 'image',
}
@Entity({ name: 'team_chat' })
export class TeamChatEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: false })
  data: string

  @ManyToOne(() => ChatEntity)
  @JoinColumn()
  chat: ChatEntity

  @Column({ default: TC_MESSAGE_TYPE.TEXT })
  type: TC_MESSAGE_TYPE

  @OneToMany(() => MentionEntity, (mention) => mention.user)
  mention: MentionEntity[]

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn()
  organization: OrganizationEntity

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  createdBy: UserEntity

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'updated_by' })
  updatedBy: UserEntity
}
