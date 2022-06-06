import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

import { BoardEntity, CardEntity } from '.'
import { ChatEntity } from '../chat'
import { OrganizationEntity, UserEntity } from '../organization'

@Entity({ name: 'list' })
export class ListEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: false })
  name: string

  @Column({ nullable: true, default:'' })
  chatType: string
  
  @Column({ nullable: true, default:'' })
  chatLabels: string
  
  @Column({ nullable: false, default: false, name: 'is_delete' })
  isDelete: boolean
  
  @Column({ nullable: false, default: 0, name: 'order_index' })
  orderIndex: number

  @OneToMany(() => CardEntity, card => card.list)
  idCards: CardEntity[]

  @ManyToOne(() => BoardEntity, board => board.lists)
  board: BoardEntity;

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn()
  organization: OrganizationEntity

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  createdBy: UserEntity

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @Column({ nullable: true, default:0 })
  pageNumber: number
  remainCount: number = 0
}
