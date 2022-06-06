import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToOne,
  OneToOne,
  OneToMany,
  ManyToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm'

import {
  BoardEntity,
  BoardLabelEntity,
  ChecklistEntity,
  CommentEntity,
  CardActivityEntity,
  CardAttachmentEntity
} from '.'

import {
  ChatEntity,
} from '../../model/chat'

import { OrganizationEntity, UserEntity } from '../organization'
import { ListEntity } from './list.entity'


@Entity({ name: 'card' })
export class CardEntity {
  
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: true })
  name: string

  @Column({ nullable: true })
  description: string
  
  @Column({ nullable : true, default:''})
  chatId: string

  @ManyToOne(() => ListEntity, list => list.idCards)
  list: ListEntity

  @ManyToOne(() => BoardEntity, board => board.cards)
  board: BoardEntity

  idMembers:string[] = []
  idLabels:string[] = []


  @Column({ nullable: false, default: false, name: 'is_subscribed' })
  subscribed: boolean

  @OneToMany(() => ChecklistEntity, (checklists) => checklists.card)
  checklists: ChecklistEntity[]
  
  @OneToMany(() => CardAttachmentEntity, (attachments) => attachments.card)
  attachments: CardAttachmentEntity[]

  @Column({ type: "int", nullable: false, default: 0, })
  checkItems: number

  @Column({ type: "int", nullable: false, default: 0, })
  checkItemsChecked: number

  @OneToMany(() => CardActivityEntity, activity => activity.card)
  activities: CardActivityEntity[]

  @Column({ nullable: true })
  due: number

  @Column({ nullable: false, default: false, name: 'is_delete' })
  isDelete: boolean
  
  @Column({ nullable: false, default: 0, name: 'order_index' })
  orderIndex: number

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
