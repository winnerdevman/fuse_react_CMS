import label from 'src/api/customer/label'
import user from 'src/api/user'
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToOne,
  OneToMany,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

import { CardEntity, ListEntity, BoardLabelEntity } from '.'
import { ChatEntity } from '../chat'
import { OrganizationEntity, UserEntity } from '../organization'
import { TodoLabelEntity } from '../todos'

@Entity({ name: 'board' })
export class BoardEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: false })
  name: string

  @Column({ nullable: false })
  uri: string

  @Column("simple-json")
  settings: { color: string, subscribed: boolean, cardCoverImages: boolean };

  @OneToMany(() => ListEntity, (list) => list.board)
  lists: ListEntity[]

  // @OneToMany(() => CardEntity, (card) => card.board)
  cards: CardEntity[] = []

  chats: ChatEntity[] = []

  // @OneToMany(() => UserEntity, (user) => user.board)
  members: UserEntity[] = []

  // @ManyToMany(() => BoardLabelEntity, (label) => label.board)
  labels: TodoLabelEntity[] = []

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @Column({ nullable: false, default: false, name: 'is_delete' })
  isDelete: boolean

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn()
  organization: OrganizationEntity

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  createdBy: UserEntity

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'updated_by' })
  updatedBy: UserEntity
}
