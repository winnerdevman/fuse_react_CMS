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

import { CardEntity } from '.'
import { OrganizationEntity, UserEntity } from '../organization'

@Entity({ name: 'comment' })
export class CommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: false, default: 'card' })
  type: string

  // @ManyToOne(() => UserEntity)
  // @JoinColumn({name: 'idMemeber'})
  // idMember: UserEntity

  @Column({ nullable: false })
  message: string

  @Column({ nullable: false, default: new Date() })
  time: Date

  // @OneToMany(() => CommentItemEntity, (commentItem) => commentItem.name)
  // checkItems: CommentItemEntity[]

  @Column({ nullable: false, default: false, name: 'is_delete' })
  isDelete: boolean

  // @ManyToOne(() => CardEntity, card => card.comments)
  // card: CardEntity

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
